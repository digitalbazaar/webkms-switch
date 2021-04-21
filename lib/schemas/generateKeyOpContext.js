/*!
 * Copyright (c) 2019-2021 Digital Bazaar, Inc. All rights reserved.
 */
'use strict';

const {CONTEXT_URL: WEBKMS_CONTEXT_URL} = require('webkms-context');
const {constants: {CONTEXT_URL: ED25519_2020_CONTEXT_URL}} =
  require('ed25519-signature-2020-context');
const {constants: {CONTEXT_URL: AES_2019_CONTEXT_URL}} =
  require('aes-key-wrapping-2019-context');
const {constants: {CONTEXT_URL: HMAC_2019_CONTEXT_URL}} =
  require('sha256-hmac-key-2019-context');
const {constants: {CONTEXT_URL: X25519_2020_CONTEXT_URL}} =
  require('x25519-key-agreement-2020-context');

module.exports = {
  anyOf: [{
    type: 'array',
    items: [{
      const: WEBKMS_CONTEXT_URL,
    }, {
      const: ED25519_2020_CONTEXT_URL,
    }]
  }, {
    type: 'array',
    items: [{
      const: WEBKMS_CONTEXT_URL,
    }, {
      const: AES_2019_CONTEXT_URL,
    }]
  }, {
    type: 'array',
    items: [{
      const: WEBKMS_CONTEXT_URL,
    }, {
      const: HMAC_2019_CONTEXT_URL,
    }]
  }, {
    type: 'array',
    items: [{
      const: WEBKMS_CONTEXT_URL,
    }, {
      const: X25519_2020_CONTEXT_URL,
    }]
  }]
};
