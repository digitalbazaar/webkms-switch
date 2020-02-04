/*!
 * Copyright (c) 2019-2020 Digital Bazaar, Inc. All rights reserved.
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
      // `controller` not required, but if given must match keystore controller
      required: ['type'],
      additionalProperties: false,
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
