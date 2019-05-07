/*
 * Copyright (c) 2019 Digital Bazaar, Inc. All rights reserved.
 */
'use strict';

module.exports = class KeyDescriptionStorage {
  constructor() {}
  async insert({id, type, controller}) {}
  async update({id, record}) {}
  async revoke({id, revoked}) {}
  async get({id}) {}
  async delete({id}) {}
};
