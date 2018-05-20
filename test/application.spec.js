import { Application } from '../src/application';

import { expect } from 'chai';

describe('Application', function () {
  describe('contructor()', function () {
    it('should be a function', function () {
      expect(Application).to.be.a('function');
    });
  });
});
