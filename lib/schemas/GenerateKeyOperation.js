/*!
 * Copyright (c) 2019-2021 Digital Bazaar, Inc. All rights reserved.
 */
import {default as context} from './generateKeyOpContext.js';

module.exports = {
  required: ['@context', 'type', 'invocationTarget'],
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
    }
  }
};
