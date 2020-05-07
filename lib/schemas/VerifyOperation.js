/*!
 * Copyright (c) 2019-2020 Digital Bazaar, Inc. All rights reserved.
 */
'use strict';

const context = require('./operationContext.js');

module.exports = {
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
