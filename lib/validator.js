/*
 * Copyright (c) 2019 Digital Bazaar, Inc. All rights reserved.
 */
'use strict';

const Ajv = require('ajv');
const jsigs = require('jsonld-signatures');
const {extendContextLoader, SECURITY_CONTEXT_V2_URL} = jsigs;
const {Ed25519Signature2018} = jsigs.suites;
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
exports.verifyProof = async (
  {operation, record, documentLoader = _defaultDocumentLoader}) => {
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

  // extend jsonld-signatures strict doc loader to load key
  const docLoader = extendContextLoader(async url => {
    if(url === record.key.id) {
      return {
        contextUrl: null,
        documentUrl: url,
        document: {
          '@context': SECURITY_CONTEXT_V2_URL,
          ...record.key
        }
      };
    }
    return documentLoader(url);
  });
  const result = await jsigs.verify(operation, {
    suite: new Ed25519Signature2018(),
    purpose: new CapabilityInvocation({
      expectedTarget: record.key.id
    }),
    documentLoader: docLoader,
    compactProof: false
  });
  if(!result.verified) {
    const error = new Error('Permission denied.');
    error.name = 'NotAllowedError';
    error.httpStatusCode = 400;
    error.key = record.key.id;
    throw error;
  }
};

async function _defaultDocumentLoader(url) {
  const error = new Error(`Dereferencing url "${url}" is prohibited.`);
  error.name = 'NotAllowedError';
  error.httpStatusCode = 400;
  throw error;
}
