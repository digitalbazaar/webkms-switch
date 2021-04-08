/*!
 * Copyright (c) 2019-2021 Digital Bazaar, Inc. All rights reserved.
 */
'use strict';

const context = require('./operationContext.js');

module.exports = {
  required: ['@context', 'invocationTarget', 'type', 'revoked'],
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
