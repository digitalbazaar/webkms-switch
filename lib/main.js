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
import {verifyHeaderValue} from '@digitalbazaar/http-digest-header';
import {validateSchema} from './validator.js';

const getRandomBytes = promisify(crypto.randomBytes);

export {KeystoreConfigStorage, ModuleManager};

export async function createMiddleware({
  storage, moduleManager, documentLoader, expectedHost, inspectCapabilityChain,
  onError, suite
} = {}) {
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
      await _validateRequest({req});
      // get keystore config
      const {body: operation} = req;
      const keyId = operation.invocationTarget && operation.invocationTarget.id;
      const keystoreId = _parseKeystoreId(keyId);
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
      const {webkms: {keystore: {kmsModule}, operation}} = req;
      const result = await runOperation({operation, kmsModule, moduleManager});
      res.json(result);
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
export async function runOperation({operation, kmsModule, moduleManager}) {
  // get WebKMS module API
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

  // get key ID from invocationTarget, which may be an object or a string
  const {invocationTarget} = operation;
  const keyId = invocationTarget && invocationTarget.id;

  // run KMS method
  let result;
  try {
    result = await method({keyId, operation});
  } catch(e) {
    if(e.name === 'DuplicateError') {
      const error = new Error('Duplicate key identifier.');
      error.name = 'DuplicateError';
      error.httpStatusCode = 409;
      error.key = keyId;
      throw error;
    }
  }

  return result;
}

function getExpectedAction({req}) {
  return _parseAction({operation: req.body});
}

function getExpectedTarget({req}) {
  // expect the target that was specified in the operation or expect the
  // whole keystore itself
  const {body: {operation: {invocationTarget}, webkms: {keystore}}} = req;
  const expectedTarget = [
    invocationTarget && invocationTarget.id,
    keystore.id
  ];
  return expectedTarget;
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

async function _validateRequest({req}) {
  // ensure header digest value matches digest of body
  const {headers: {digest: expectedDigest}, body: operation} = req.headers;
  const {verified} = await verifyHeaderValue({
    data: operation, headerValue: expectedDigest});
  if(!verified) {
    const error = new Error(
      'Header digest value does not match digest of body.');
    error.name = 'DataError';
    error.httpStatusCode = 400;
    throw error;
  }

  // ensure body is a valid WebKMS operation
  await validateSchema({operation});
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
