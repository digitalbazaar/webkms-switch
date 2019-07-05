/*!
 * Copyright (c) 2019 Digital Bazaar, Inc. All rights reserved.
 */
'use strict';

const context = require('./operationContext.js');

module.exports = {
  required: ['@context', 'invocationTarget', 'type', 'wrappedKey'],
  additionalProperties: false,
  properties: {
    '@context': context,
    invocationTarget: {
      type: 'string'
    },
    type: {
      type: 'string',
      enum: ['UnwrapKeyOperation']
    },
    wrappedKey: {
      type: 'string'
    }
  }
};
