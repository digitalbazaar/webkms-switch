/*!
 * Copyright (c) 2019-2024 Digital Bazaar, Inc. All rights reserved.
 */
import * as base58 from 'base58-universal';
import * as crypto from 'node:crypto';
import asyncHandler from 'express-async-handler';
import {authorizeZcapInvocation} from '@digitalbazaar/ezcap-express';
import {KeystoreConfigStorage} from './KeystoreConfigStorage.js';
import {ModuleManager} from './ModuleManager.js';
import {promisify} from 'node:util';
import {validateSchema} from './validator.js';

const getRandomBytes = promisify(crypto.randomBytes);

export {KeystoreConfigStorage, ModuleManager};

export function createOperationMiddleware({
  storage, moduleManager, documentLoader, expectedHost,
  getRootController = _getRootController,
  getVerifier,
  inspectCapabilityChain,
  maxChainLength = 10,
  // 300 second clock skew permitted by default
  maxClockSkew = 300,
  // 90 day max TTL by default
  maxDelegationTtl = 1000 * 60 * 60 * 24 * 90,
  onError, onSuccess, suiteFactory
} = {}) {
  if(onSuccess && typeof onSuccess !== 'function') {
    throw new TypeError('"onSuccess" must be a function.');
  }

  // create zcap authz middleware
  const authorize = authorizeZcapInvocation({
    documentLoader,
    getExpectedValues: _createGetExpectedValues({expectedHost}),
    getRootController,
    getVerifier, inspectCapabilityChain,
    maxChainLength,
    maxClockSkew,
    maxDelegationTtl,
    onError, suiteFactory
  });

  return [
    // validate request
    // eslint-disable-next-line no-unused-vars
    asyncHandler(async function validateRequestMiddleware(req, res, next) {
      // ensure body is a valid WebKMS operation
      const {body: operation} = req;
      await validateSchema({operation});

      // allow other previous middleware to customize building `req.webkms`
      if(!req.webkms) {
        req.webkms = {};
      }
      if(!req.webkms.operation) {
        req.webkms.operation = operation;
      }

      // parse keystore ID from operation or URL
      let keystoreId;
      const requestUrl = `https://${req.get('host')}${req.originalUrl}`;
      if(operation.type === 'GenerateKeyOperation') {
        // `keyId` not present when generating a new key, use request URL
        // sans trailing `/keys` instead
        // NOTE: although the local server may be running in HTTP mode and
        // received the request from a proxy via HTTP, the URL here should
        // always be HTTPS
        keystoreId = requestUrl.slice(0, requestUrl.length - '/keys'.length);
      } else {
        const keyId = operation.invocationTarget.id ||
          operation.invocationTarget;
        keystoreId = _parseKeystoreId(keyId);

        // ensure key ID (invocation target) matches request URL
        if(requestUrl !== keyId) {
          const error = new Error(
            'KMS operation invocation target does not match request URL.');
          error.name = 'DataError';
          error.httpStatusCode = 400;
          error.requestUrl = requestUrl;
          error.invocationTarget = keyId;
          throw error;
        }
      }

      // if keystore config already provided by the application; confirm
      // that the expected (parsed) keystore ID matches the app provided value
      if(req.webkms.keystore) {
        if(req.webkms.keystore.id !== keystoreId) {
          const error = new Error(
            'Keystore ID parsed from request does not match loaded keystore.');
          error.name = 'DataError';
          // this is a server bug
          error.httpStatusCode = 500;
          error.requestUrl = requestUrl;
          error.expected = keystoreId;
          error.actual = req.webkms.keystore.id;
          throw error;
        }
      } else {
        // get keystore config from storage and cache it as request meta
        req.webkms.keystore = await storage.get({id: keystoreId, req});
      }

      // proceed to next middleware on next tick to prevent subsequent
      // middleware from potentially throwing here
      process.nextTick(next);
    }),
    // authorize request
    authorize,
    // eslint-disable-next-line no-unused-vars
    asyncHandler(async function runOperationMiddleware(req, res, next) {
      const {webkms: {keystore, operation}, zcap: zcapInvocation} = req;
      let operationResult;
      try {
        operationResult = await runOperation(
          {operation, keystore, moduleManager, zcapInvocation});
      } catch(error) {
        _handleError({res, error, onError});
      }
      const {keyId, result} = operationResult;
      if(operation.type === 'GenerateKeyOperation') {
        // return location of new key
        res.location(keyId);
      }
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
export async function runOperation({
  operation, keystore, moduleManager, zcapInvocation
}) {
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
    result = await method({
      keyId,
      controller: keystore.controller,
      operation,
      zcapInvocation
    });
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

  return {keyId, result};
}

function _getRootController({req}) {
  /* Note: `rootInvocationTarget` will always match `req.webkms.keystore.id`
  because of how this function is invoked via the above middleware and per
  zcapld, which only dereferences a root zcap if it is expected. The only
  expected root zcap is one with an `invocationTarget` of
  `req.webkms.keystore.id`, as this is specified in `getExpectedValues` using
  `rootInvocationController`. This means we do not need to do anything extra
  here to ensure the values match. */
  return req.webkms.keystore.controller;
}

function _createGetExpectedValues({expectedHost}) {
  return async function getExpectedValues({req}) {
    const {webkms: {keystore}} = req;
    return {
      // action in the invocation MUST match the action in the body
      action: _parseAction({operation: req.body}),
      host: expectedHost,
      // expected root invocation target is the keystore; every key in a
      // keystore uses the keystore's root zcap as its root
      rootInvocationTarget: keystore.id
    };
  };
}

function _handleError({res, error, onError}) {
  if(error.httpStatusCode) {
    res.status(error.httpStatusCode);
  } else if(res.status < 400) {
    res.status(500);
  }
  if(onError) {
    return onError({error});
  }
  throw error;
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
