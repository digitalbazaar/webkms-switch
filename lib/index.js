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
const CONTEXT_URL_2018 = 'https://w3id.org/security/ed25519-signature-2018/v1';
const CONTEXT_URL_2020 = 'https://w3id.org/security/ed25519-signature-2020/v1';

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
  let contextUrl;
  if(operation.invocationTarget.type === 'Ed25519VerificationKey2018') {
    contextUrl = SECURITY_CONTEXT_V2_URL || CONTEXT_URL_2018;
  } else if(operation.invocationTarget.type === 'Ed25519VerificationKey2020') {
    contextUrl = CONTEXT_URL_2020;
  }
  if(isGenerateKeyOp) {
    if(!record) {
      const key = {
        '@context': contextUrl,
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

  let result;
  try {
    result = await method({keyId, operation});
  } catch(e) {
    throw e;
  }
  // remove pending flag
  if(isGenerateKeyOp) {
    delete record.meta.pending;
    const key = {...record.key, ...result};
    await storage.update({id: keyId, key, meta: record.meta});
  }

  return result;
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
