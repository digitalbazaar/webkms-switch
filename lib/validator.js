/*!
 * Copyright (c) 2019-2021 Digital Bazaar, Inc. All rights reserved.
 */
import * as Ajv from 'ajv';
import {KmsOperation} from './schemas.js';

const ajv = new Ajv({verbose: true});

// throws if validation fails
export async function validateSchema({operation}) {
  // validate operation against KmsOperation JSON schema
  const valid = ajv.validate(KmsOperation, operation);
  if(valid) {
    return true;
  }
  const error = new SyntaxError('KMS Operation is invalid.');
  error.errors = ajv.errors;
  throw error;
}
