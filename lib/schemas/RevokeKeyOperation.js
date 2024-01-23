/*!
 * Copyright (c) 2019-2024 Digital Bazaar, Inc. All rights reserved.
 */
import {default as context} from './operationContext.js';

export default {
  required: ['invocationTarget', 'type', 'revoked'],
  additionalProperties: false,
  properties: {
    '@context': context,
    invocationTarget: {
      type: 'string'
    },
    revoked: {
      type: 'string'
    },
    type: {
      type: 'string',
      enum: ['DeleteKeyOperation']
    }
  }
};
