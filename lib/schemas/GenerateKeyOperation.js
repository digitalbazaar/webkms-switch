/*!
 * Copyright (c) 2019 Digital Bazaar, Inc. All rights reserved.
 */
'use strict';

const context = require('./operationContext.js');
const proof = require('./capabilityInvocationProof.js');

module.exports = {
  required: ['@context', 'proof', 'type', 'invocationTarget', 'kmsModule'],
  additionalProperties: false,
  properties: {
    '@context': context,
    proof,
    type: {
      type: 'string',
      enum: ['GenerateKeyOperation']
    },
    invocationTarget: {
      type: 'object',
      required: ['id', 'type', 'controller'],
      properties: {
        id: {
          type: 'string'
        },
        type: {
          type: 'string'
        },
        controller: {
          type: 'string'
        }
      }
    },
    kmsModule: {
      type: 'string'
    }
  }
};
