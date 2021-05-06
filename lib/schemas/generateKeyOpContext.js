/*!
 * Copyright (c) 2019-2021 Digital Bazaar, Inc. All rights reserved.
 */
'use strict';

const {CONTEXT_URL: WEBKMS_CONTEXT_URL} = require('webkms-context');

module.exports = {
  type: 'array',
  items: [{
    const: WEBKMS_CONTEXT_URL,
  }, {
    type: 'string'
  }]
};
