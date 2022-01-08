/*!
 * Copyright (c) 2019-2022 Digital Bazaar, Inc. All rights reserved.
 */
import {default as DeleteKeyOperation} from './DeleteKeyOperation.js';
import {default as DeriveSecretOperation} from './DeriveSecretOperation.js';
import {default as ExportKeyOperation} from './ExportKeyOperation.js';
import {default as GenerateKeyOperation} from './GenerateKeyOperation.js';
import {default as UpdateKeyOperation} from './UpdateKeyOperation.js';
import {default as RevokeKeyOperation} from './RevokeKeyOperation.js';
import {default as SignOperation} from './SignOperation.js';
import {default as UnwrapKeyOperation} from './UnwrapKeyOperation.js';
import {default as VerifyOperation} from './VerifyOperation.js';
import {default as WrapKeyOperation} from './WrapKeyOperation.js';

export default {
  title: 'KMS Operation',
  type: 'object',
  anyOf: [
    DeleteKeyOperation,
    DeriveSecretOperation,
    ExportKeyOperation,
    GenerateKeyOperation,
    UpdateKeyOperation,
    RevokeKeyOperation,
    SignOperation,
    UnwrapKeyOperation,
    VerifyOperation,
    WrapKeyOperation
  ]
};
