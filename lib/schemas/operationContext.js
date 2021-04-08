/*!
 * Copyright (c) 2019-2021 Digital Bazaar, Inc. All rights reserved.
 */
'use strict';
const sec = require('security-context');

module.exports = {
  type: 'string',
  enum: [sec.constants.SECURITY_CONTEXT_V2_URL]
};
