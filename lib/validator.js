/*!
 * Copyright (c) 2019-2022 Digital Bazaar, Inc. All rights reserved.
 */
import {default as Ajv} from 'ajv';
import {KmsOperation} from './schemas/index.js';

const ajv = new Ajv({verbose: true});

// compile KmsOperation schema once on startup
const validate = ajv.compile(KmsOperation);

// throws if validation fails
export async function validateSchema({operation}) {
  // validate operation against KmsOperation JSON schema
  const valid = validate(operation);
  if(valid) {
    return true;
  }
  const error = new SyntaxError('KMS Operation is invalid.');
  error.errors = validate.errors;
  throw error;
}
