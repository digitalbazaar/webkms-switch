/*!
 * Copyright (c) 2019-2021 Digital Bazaar, Inc. All rights reserved.
 */
'use strict';
const {CONTEXT_URL: WEBKMS_CONTEXT_URL} = require('webkms-context');

module.exports = {
  anyOf: [{
    type: 'array',
    items: [{
      const: WEBKMS_CONTEXT_URL,
    }, {
      const: 'https://w3id.org/security/suites/ed25519-2020/v1',
    }]
  }, {
    type: 'array',
    items: [{
      const: WEBKMS_CONTEXT_URL,
    }, {
      const: 'https://w3id.org/security/suites/aes-key-wrapping-2019/v1',
    }]
  }, {
    type: 'array',
    items: [{
      const: WEBKMS_CONTEXT_URL,
    }, {
      const: 'https://w3id.org/security/suites/sha256-hmac-2019/v1',
    }]
  }, {
    type: 'array',
    items: [{
      const: WEBKMS_CONTEXT_URL,
    }, {
      const: 'https://w3id.org/security/suites/x25519-2020/v1',
    }]
  }]
};
