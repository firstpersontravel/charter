const assert = require('assert');

const roleConditions = require('../../../src/modules/roles/role_conditions');

describe('#current_role_is', () => {
  function assertIfEq(ctx, stmt, val) {
    assert.strictEqual(roleConditions.current_role_is.eval(stmt, ctx), val);
  }

  it('returns true if context role matches condition', () => {
    const stmt = { op: 'current_role_is', role_name: 'gabe' };
    const context = { triggeringRoleName: 'gabe' };
    assertIfEq(context, stmt, true);
  });

  it('returns false if context role does not match condition', () => {
    const stmt = { op: 'current_role_is', role_name: 'phil' };
    const context = { triggeringRoleName: 'gabe' };
    assertIfEq(context, stmt, false);
  });

  it('returns false if context has no role', () => {
    const stmt = { op: 'current_role_is', role_name: 'gabe' };
    const context = { triggeringRoleName: null };
    assertIfEq(context, stmt, false);   
  });
});

describe('#role_page_is', () => {
  function assertIfEq(ctx, stmt, val) {
    assert.strictEqual(roleConditions.role_page_is.eval(stmt,
      { evalContext: ctx }), val);
  }

  it('returns true if role is on specified page', () => {
    const stmt = { op: 'role_page_is', role_name: 'gabe', page_name: '123' };
    const context = { tripState: { currentPageNamesByRole: { gabe: '123' } } };
    assertIfEq(context, stmt, true);  
  });

  it('returns false if role is not on specified page', () => {
    const stmt = { op: 'role_page_is', role_name: 'gabe', page_name: '123' };
    const context = { tripState: { currentPageNamesByRole: { gabe: '456' } } };
    assertIfEq(context, stmt, false); 
  });

  it('returns false if role is not any page', () => {
    const stmt = { op: 'role_page_is', role_name: 'gabe', page_name: '123' };
    const context = { tripState: { currentPageNamesByRole: { phil: '456' } } };
    assertIfEq(context, stmt, false); 
  });
});
