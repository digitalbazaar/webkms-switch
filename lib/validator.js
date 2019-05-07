/*
 * Copyright (c) 2019 Digital Bazaar, Inc. All rights reserved.
 */
'use strict';

const Ajv = require('ajv');
const jsigs = require('jsonld-signatures');
const {CapabilityInvocation} = require('ocapld');
const ajv = new Ajv({verbose: true});
const {KmsOperation} = require('./schemas');

// throws if validation fails
exports.validateSchema = async ({operation}) => {
  // validate operation against KmsOperation JSON schema
  const valid = ajv.validate(KmsOperation, operation);
  if(valid) {
    return true;
  }
  const error = new SyntaxError('KMS Operation is invalid.');
  error.errors = ajv.errors;
  throw error;
};

// throws if verification fails
exports.verifyProof = async ({operation, record}) => {
  const isGenerateKeyOp = operation.type === 'GenerateKeyOperation';
  if(!record) {
    if(!isGenerateKeyOp) {
      throw new TypeError('"record" must be an object.');
    }
    // dynamically generate record
    record = {
      key: {...operation.invocationTarget}
    };
  }

  // TODO: use ocapld to validate capability invocation proof, passing
  // a document loader that will return record.key for record.id

  // FIXME: remove this; this check should happen automatically via ocapld
  // if there is an existing key record, controller must match in all cases
  const controller = operation.proof.verificationMethod;
  if(record && record.key.controller !== controller) {
    const error = new Error('Permission denied.');
    error.name = 'NotAllowedError';
    error.httpStatusCode = 400;
    error.key = record.key.id;
  }
};
