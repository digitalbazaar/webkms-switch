/*!
 * Copyright (c) 2019-2021 Digital Bazaar, Inc. All rights reserved.
 */
import {default as context} from './operationContext.js';

export default {
  required: [
    '@context', 'invocationTarget', 'type',
    'signatureValue', 'verifyData'
  ],
  additionalProperties: false,
  properties: {
    '@context': context,
    invocationTarget: {
      type: 'string'
    },
    type: {
      type: 'string',
      enum: ['VerifyOperation']
    },
    signatureValue: {
      type: 'string'
    },
    verifyData: {
      type: 'string'
    }
  }
};
