/*!
 * Copyright (c) 2019-2020 Digital Bazaar, Inc. All rights reserved.
 */
'use strict';

const DeleteKeyOperation = require('./DeleteKeyOperation.js');
const DeriveSecretOperation = require('./DeriveSecretOperation.js');
const ExportKeyOperation = require('./ExportKeyOperation.js');
const GenerateKeyOperation = require('./GenerateKeyOperation.js');
const RevokeKeyOperation = require('./RevokeKeyOperation.js');
const SignOperation = require('./SignOperation.js');
const UnwrapKeyOperation = require('./UnwrapKeyOperation.js');
const VerifyOperation = require('./VerifyOperation.js');
const WrapKeyOperation = require('./WrapKeyOperation.js');

module.exports = {
  title: 'KMS Operation',
  type: 'object',
  anyOf: [
    DeleteKeyOperation,
    DeriveSecretOperation,
    ExportKeyOperation,
    GenerateKeyOperation,
    RevokeKeyOperation,
    SignOperation,
    UnwrapKeyOperation,
    VerifyOperation,
    WrapKeyOperation
  ]
};
