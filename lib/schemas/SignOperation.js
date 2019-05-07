/*!
 * Copyright (c) 2019 Digital Bazaar, Inc. All rights reserved.
 */
'use strict';

const context = require('./operationContext.js');
const proof = require('./capabilityInvocationProof.js');

module.exports = {
  required: ['@context', 'invocationTarget', 'proof', 'type', 'verifyData'],
  additionalProperties: false,
  properties: {
    '@context': context,
    invocationTarget: {
      type: 'string'
    },
    proof,
    type: {
      type: 'string',
      enum: ['SignOperation']
    },
    verifyData: {
      type: 'string'
    }
  }
};
