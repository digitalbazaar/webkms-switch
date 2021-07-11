/*!
 * Copyright (c) 2019-2021 Digital Bazaar, Inc. All rights reserved.
 */
import asyncHandler from 'express-async-handler';
import {authorizeZcapInvocation} from '@digitalbazaar/ezcap-express';
import * as base58 from 'base58-universal';
import * as crypto from 'crypto';
import {KeystoreConfigStorage} from './KeystoreConfigStorage.js';
import {ModuleManager} from './ModuleManager.js';
import {promisify} from 'util';
import {validateSchema} from './validator.js';

const getRandomBytes = promisify(crypto.randomBytes);

export {KeystoreConfigStorage, ModuleManager};

export function createMiddleware({
  storage, moduleManager, documentLoader, expectedHost, inspectCapabilityChain,
  onError, onSuccess, suite
} = {}) {
  if(onSuccess && typeof onSuccess !== 'function') {
    throw new TypeError('"onSuccess" must be a function.');
  }

  // create zcap authz middleware
  const authorize = authorizeZcapInvocation({
    documentLoader, getExpectedAction, expectedHost,
    getExpectedTarget, getRootController, inspectCapabilityChain,
    onError, suite
  });

  return [
    // validate request
    // eslint-disable-next-line no-unused-vars
    asyncHandler(async function validateRequestMiddleware(req, res, next) {
      // ensure body is a valid WebKMS operation
      const {body: operation} = req;
      await validateSchema({operation});

      // get keystore config by parsing keystore ID from operation or URL
      let keystoreId;
      if(operation.type === 'GenerateKeyOperation') {
        // `keyId` not present when generating a new key, use request URL
        // sans trailing `/keys` instead
        const requestUrl = `${req.protocol}://${req.get('host')}${req.url}`;
        keystoreId = requestUrl.substr(0, requestUrl.length - '/keys'.length);
      } else {
        const keyId = operation.invocationTarget.id ||
          operation.invocationTarget;
        keystoreId = _parseKeystoreId(keyId);
      }
      const keystore = await storage.get({id: keystoreId, req});

      // set webkms request information
      req.webkms = {keystore, operation};

      // proceed to next middleware on next tick to prevent subsequent
      // middleware from potentially throwing here
      process.nextTick(next);
    }),
    // authorize request
    authorize,
    // eslint-disable-next-line no-unused-vars
    asyncHandler(async function runOperationMiddleware(req, res, next) {
      const {webkms: {keystore, operation}} = req;
      const result = await runOperation({operation, keystore, moduleManager});
      res.json(result);
      if(onSuccess) {
        await onSuccess({req, res, next, result});
      }
    })
  ];
}

export async function generateRandom() {
  // 128-bit random number, multibase encoded
  // 0x00 = identity tag, 0x10 = length (16 bytes)
  const buf = Buffer.concat([
    Buffer.from([0x00, 0x10]),
    await getRandomBytes(16)
  ]);
  // multibase encoding for base58 starts with 'z'
  return 'z' + base58.encode(buf);
}

// presumes the operation is valid
export async function runOperation({operation, keystore, moduleManager}) {
  // get WebKMS module API
  const {kmsModule} = keystore;
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

  // generate key ID for new key
  if(operation.type === 'GenerateKeyOperation') {
    const random = await generateRandom();
    operation = {
      ...operation,
      invocationTarget: {
        ...operation.invocationTarget,
        id: `${keystore.id}/keys/${random}`
      }
    };
  }

  // get key ID from invocationTarget, which may be an object or a string
  const {invocationTarget} = operation;
  const keyId = invocationTarget.id || invocationTarget;

  // run KMS method
  let result;
  try {
    result = await method({keyId, operation});
  } catch(e) {
    if(e.name !== 'DuplicateError') {
      throw e;
    }
    const error = new Error('Duplicate key identifier.');
    error.name = 'DuplicateError';
    error.httpStatusCode = 409;
    error.key = keyId;
    throw error;
  }

  return result;
}

function getExpectedAction({req}) {
  return _parseAction({operation: req.body});
}

function getExpectedTarget({req}) {
  // expect the target that was specified in the operation or expect the
  // keystore itself as the target
  const {webkms: {keystore, operation: {invocationTarget}}} = req;
  const expectedTarget = [
    invocationTarget.id || invocationTarget,
    keystore.id
  ];
  return {expectedTarget};
}

function getRootController({req, rootCapabilityId, rootInvocationTarget}) {
  // ensure `rootInvocationTarget` starts with `req.webkms.keystore.id`
  const {webkms: {keystore}} = req;
  if(!rootInvocationTarget.startsWith(keystore.id)) {
    const error = new Error(`Capability "${rootCapabilityId}" not found.`);
    error.name = 'NotFoundError';
    error.httpStatusCode = 404;
    throw error;
  }
  return req.webkms.keystore.controller;
}

function _parseAction({operation}) {
  const {type} = operation;
  return type.charAt(0).toLowerCase() +
    type.substring(1, type.indexOf('Operation'));
}

function _parseKeystoreId(keyId) {
  // key ID format: <baseUrl>/<keystores-path>/<keystore-id>/keys/<key-id>
  const idx = keyId.lastIndexOf('/keys/');
  if(idx === -1) {
    throw new Error(`Invalid key ID "${keyId}".`);
  }
  return keyId.substr(0, idx);
}
