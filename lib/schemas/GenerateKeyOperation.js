/*!
 * Copyright (c) 2019 Digital Bazaar, Inc. All rights reserved.
 */
'use strict';

const context = require('./operationContext.js');

module.exports = {
  required: ['@context', 'type', 'invocationTarget', 'kmsModule'],
  additionalProperties: false,
  properties: {
    '@context': context,
    type: {
      type: 'string',
      enum: ['GenerateKeyOperation']
    },
    invocationTarget: {
      type: 'object',
      required: ['type', 'controller'],
      properties: {
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
