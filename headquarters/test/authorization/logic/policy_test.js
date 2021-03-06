const assert = require('assert');
const sinon = require('sinon');

const { sandbox } = require('../../mocks');
const Policy = require('../../../src/authorization/logic/policy');

describe('Policy', () => {
  const subject = { name: 'tester' };
  const action = 'adjustment';

  describe('#getPolicyResult', () => {
    const resource = { modelName: 'Model', record: null, fieldName: null };

    it('defaults to deny if no policies return results', () => {
      const policy = new Policy([{
        test: sandbox.stub().returns(null)
      }]);

      const res = policy.getPolicyResult(subject, action, resource, {});

      // Test result is denied
      assert.deepStrictEqual(res, {
        policyName: 'defaultDeny',
        allowed: false,
        reason: 'No policy allowed this action.'      
      });

      // Test policy was called
      sinon.assert.calledWith(policy.subPolicies[0].test, subject, action,
        resource, {});
    });

    it('returns first policy to allow', () => {
      const policy = new Policy([{
        name: 'policy1',
        test: sandbox.stub().returns({ allowed: true, reason: 'abc' })
      }, {
        name: 'policy2',
        test: sandbox.stub().returns({ allowed: true, reason: 'def' })
      }]);

      const res = policy.getPolicyResult(subject, action, resource, {});

      // Test result is result from first policy
      assert.deepStrictEqual(res, {
        policyName: 'policy1',
        allowed: true,
        reason: 'abc'      
      });

      // Test first policy was called
      sinon.assert.calledWith(policy.subPolicies[0].test, subject, action,
        resource, {});
      // Test second policy was not called
      sinon.assert.notCalled(policy.subPolicies[1].test);
    });

    it('returns first policy to deny', () => {
      const policy = new Policy([{
        name: 'policy1',
        test: sandbox.stub().returns({ allowed: false, reason: 'abc' })
      }, {
        name: 'policy2',
        test: sandbox.stub().returns({ allowed: false, reason: 'def' })
      }]);

      const res = policy.getPolicyResult(subject, action, resource, {});

      // Test result is result from first policy
      assert.deepStrictEqual(res, {
        policyName: 'policy1',
        allowed: false,
        reason: 'abc'      
      });

      // Test first policy was called
      sinon.assert.calledWith(policy.subPolicies[0].test, subject, action,
        resource, {});
      // Test second policy was not called
      sinon.assert.notCalled(policy.subPolicies[1].test);
    });
  });

  describe('#hasPermission', () => {

    const policy = new Policy([]);
    const stubResult = {
      policyName: 'abc',
      allowed: true,
      reason: 'Permission granted.'
    };

    beforeEach(() => {
      sandbox.stub(policy, 'getPolicyResult').returns(stubResult);
    });

    it('annotates result with message on new record', () => {
      const resource = { modelName: 'Model', record: {}, fieldName: null };

      const res = policy.hasPermission(subject, action, resource, {});

      const expectedMessage = (
        'Action \'adjustment\' on record \'model\' by \'tester\' allowed.'
      );
      const expectedResult = Object.assign({}, { message: expectedMessage },
        stubResult);
      assert.deepStrictEqual(res, expectedResult);
    });

    it('annotates result with message on existing record', () => {
      const resource = {
        modelName: 'Model',
        record: { id: 3 },
        fieldName: null
      };

      const res = policy.hasPermission(subject, action, resource, {});

      const expectedMessage = 
        'Action \'adjustment\' on record \'model #3\' by \'tester\' allowed.';
      const expectedResult = Object.assign({}, { message: expectedMessage },
        stubResult);
      assert.deepStrictEqual(res, expectedResult);
    });

    it('annotates result with message on field', () => {
      const resource = {
        modelName: 'Model',
        record: { id: 3 },
        fieldName: 'abc'
      };

      const res = policy.hasPermission(subject, action, resource, {});

      const expectedMessage = (
        'Action \'adjustment\' on field \'abc\' of record \'model #3\' by \'tester\' allowed.'
      );
      const expectedResult = Object.assign({}, { message: expectedMessage },
        stubResult);
      assert.deepStrictEqual(res, expectedResult);
    });
  });

});
