/*!
 * Copyright (c) 2019-2022 Digital Bazaar, Inc. All rights reserved.
 */
import {default as context} from './operationContext.js';

export default {
  required: ['@context', 'invocationTarget', 'type'],
  additionalProperties: false,
  properties: {
    '@context': context,
    invocationTarget: {
      type: 'string'
    },
    type: {
      type: 'string',
      enum: ['UpdateKeyOperation']
    },
    maxCapabilityChainLength: {
      type: 'integer'
    },
    publicAlias: {
      type: 'string'
    },
    publicAliasTemplate: {
      type: 'string'
    }
  }
};
