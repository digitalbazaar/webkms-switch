/*
 * Copyright (c) 2019 Digital Bazaar, Inc. All rights reserved.
 */
'use strict';

const Ajv = require('ajv');
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
