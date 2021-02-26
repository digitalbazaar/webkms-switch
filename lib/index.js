/*
 * Copyright (c) 2019-2020 Digital Bazaar, Inc. All rights reserved.
 */
'use strict';

const validator = require('./validator');
const {verifyCapabilityInvocation} = require('http-signature-zcap-verify');
const bs58 = require('bs58');
const crypto = require('crypto');
const {promisify} = require('util');
const getRandomBytes = promisify(crypto.randomBytes);

const SECURITY_CONTEXT_V2_URL = 'https://w3id.org/security/v2';

exports.KeyDescriptionStorage = require('./KeyDescriptionStorage.js');
exports.ModuleManager = require('./ModuleManager.js');

exports.validateOperation = async ({
  url, method, headers, operation, storage, getInvokedCapability,
  documentLoader, expectedHost, expectedTarget = url,
  expectedRootCapability, inspectCapabilityChain, suite
}) => {
  // Note: Assumes that the `Digest` header was previously confirmed to
  // match the body that `operation` was parsed from.

  try {
    await validator.validateSchema({operation});
  } catch(e) {
    return {valid: false, error: e};
  }
  if(operation.type !== 'GenerateKeyOperation') {
    // Parse the invocationTarget
    const {host: keyHost} = new URL(
      operation.invocationTarget.id || operation.invocationTarget);
    if(keyHost !== expectedHost) {
      throw new Error(`kms expected ${expectedHost} in key id, but` +
        ` key's host is ${keyHost}`);
    }
  }

  // wrap document loader to always generate root zcap from key
  // description in storage
  const wrappedDocumentLoader = async url => {
    if(url === expectedTarget) {
      // dynamically generate zcap for root capability
      const {key} = await storage.get({id: url});
      return {
        contextUrl: null,
        documentUrl: url,
        document: key
      };
    }
    return documentLoader(url);
  };

  // TODO: need to ensure `expectedTarget` matches `operation.invocationTarget`?

  const expectedAction = _parseAction({operation});
  const result = await verifyCapabilityInvocation({
    url, method, headers,
    getInvokedCapability,
    documentLoader: wrappedDocumentLoader,
    expectedHost, expectedTarget, expectedRootCapability, expectedAction,
    inspectCapabilityChain, suite
  });
  return {
    valid: result.verified,
    ...result
  };
};

exports.runOperation = async ({operation, storage, moduleManager}) => {
  // Note: Assumes the operation was authorized (via HTTP signature capability
  // invocation) and that `validateOperation` was run previously

  // invocationTarget may be an object or a string
  const {invocationTarget} = operation;
  const keyId = (typeof invocationTarget === 'string') ? invocationTarget :
    invocationTarget.id;

  const isGenerateKeyOp = operation.type === 'GenerateKeyOperation';

  let record;
  try {
    record = await storage.get({id: keyId});
  } catch(e) {
    if(!(isGenerateKeyOp && e.name === 'NotFoundError')) {
      throw e;
    }
  }

  let recoveryMode = false;
  if(record && record.meta.pending) {
    recoveryMode = true;
  }

  if(recoveryMode && !isGenerateKeyOp) {
    // the caller was never told that the key generation succeeded
    // operations on pending keys are not allowed
    const error = new Error('Key not found.');
    error.name = 'NotFoundError';
    error.httpStatusCode = 404;
    error.key = keyId;
    throw error;
  }

  if(isGenerateKeyOp) {
    if(!record) {
      const key = {
        '@context': SECURITY_CONTEXT_V2_URL,
        id: keyId,
        ...operation.invocationTarget,
        kmsModule: operation.kmsModule
      };
      record = {key, meta: {pending: true}};
      await storage.insert(record);
    } else if(!recoveryMode) {
      const error = new Error('Duplicate key identifier.');
      error.name = 'DuplicateError';
      error.httpStatusCode = 409;
      error.key = keyId;
      throw error;
    }
    // if recovery is true fallthrough to attempt to generate the key again

    // FIXME: it's possible that the operation terms have changed, the
    // `kmsModule` and controller might not match what was in the previous
    // record, in which case we need to remove the pending record
  }

  const {kmsModule} = isGenerateKeyOp ? operation : record.key;
  const moduleApi = await moduleManager.get({id: kmsModule});

  // determine method
  const methodName = operation.type.charAt(0).toLowerCase() +
    operation.type.substring(1, operation.type.indexOf('Operation'));
  const method = moduleApi[methodName];
  if(!method) {
    const error = new Error('KMS operation not supported.');
    error.name = 'NotSupportedError';
    error.httpStatusCode = 400;
    error.method = methodName;
    error.kmsModule = kmsModule;
    throw error;
  }

  const result = await method({keyId, operation});

  // remove pending flag
  if(isGenerateKeyOp) {
    delete record.meta.pending;
    const key = {...record.key, ...result};
    await storage.update({id: keyId, key, meta: record.meta});
  }

  return result;
};

/**
 * Takes in a request to a kms system from a proxy and validates it.
 *
 * @param {object} options - Options to use.
 * @param {Map<string, Array<string>>} options.allowedHosts - A Map
 *   with a host and an optional Array of allowed ips.
 * @param {string} options.host - An URL's host.
 * @param {string} options.ip - An ip for the request.
 *
 * @returns {object} An object with the verify result and any errors.
 */
exports.validateRequest = ({allowedHosts, host, ip}) => {
  let verified = false;
  for(const [allowedHost, ips = []] of allowedHosts) {
    // if we already found a valid host/ip entry stop
    if(verified) {
      break;
    }
    // if the host does not match the entry go to the next entry
    if(host !== allowedHost) {
      continue;
    }
    // if the entry matches the host, but there are no ip rules
    // then verify and stop
    if(!ips || ips.length === 0) {
      verified = true;
      break;
    }
    // if there are ip rules use them to set verified
    verified = ips.includes(ip);
  }
  return {verified};
};

exports.generateRandom = async () => {
  // 128-bit random number, multibase encoded
  // 0x00 = identity tag, 0x10 = length (16 bytes)
  const buf = Buffer.concat([
    Buffer.from([0x00, 0x10]),
    await getRandomBytes(16)
  ]);
  // multibase encoding for base58 starts with 'z'
  return 'z' + bs58.encode(buf);
};

function _parseAction({operation}) {
  return operation.type.charAt(0).toLowerCase() +
    operation.type.substring(1, operation.type.indexOf('Operation'));
}
