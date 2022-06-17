/*!
 * Copyright (c) 2021 Digital Bazaar, Inc. All rights reserved.
 */
import chai from 'chai';
chai.should();
const {expect} = chai;

import * as webkmsSwitch from '../lib/index.js';

describe('webkms-switch', () => {
  describe('import', () => {
    it('should have imported the library', async () => {
      expect(webkmsSwitch).to.exist;
    });
  });
});
