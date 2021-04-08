/*!
 * Copyright (c) 2019-2021 Digital Bazaar, Inc. All rights reserved.
 */
'use strict';

module.exports = {
  type: 'object',
  required: [
    'type', 'capability', 'created', 'jws',
    'proofPurpose', 'verificationMethod'
  ],
  additionalProperties: false,
  properties: {
    type: {
      type: 'string'
    },
    created: {
      type: 'string'
    },
    capability: {
      type: 'string'
    },
    capabilityAction: {
      type: 'string'
    },
    proofPurpose: {
      type: 'string',
      enum: ['capabilityInvocation']
    },
    verificationMethod: {
      type: 'string'
    },
    jws: {
      type: 'string'
    }
  }
};
