/*
 * Copyright (c) 2019 Digital Bazaar, Inc. All rights reserved.
 */
'use strict';

const validator = require('./validator');

exports.KeyDescriptionStorage = require('./KeyDescriptionStorage.js');
exports.ModuleManager = require('./ModuleManager.js');

exports.validateOperation = async ({operation}) => {
  return await validator.validateSchema({operation});
};

exports.runOperation = async ({
  operation, storage, moduleManager, documentLoader}) => {
  // Note: Assumes `validateOperation` was run previously

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

  // FIXME: capability verification temporarily disabled

  // verify capability invocation proof
  //await validator.verifyProof({operation, record, documentLoader});

  if(isGenerateKeyOp) {
    if(!record) {
      const key = {
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
    await storage.update({id: keyId, meta: record.meta});
  }

  return result;
};
