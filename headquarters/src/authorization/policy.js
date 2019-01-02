class Policy {

  /**
   * Create a policy instance with subpolicies to test.
   */
  constructor(subPolicies) {
    this.subPolicies = subPolicies;
  }

  /**
   * Test each policy and return first that returns a yes or no result.
   */
  getPolicyResult(subject, action, resource, context) {
    for (const policy of this.subPolicies) {
      const result = policy.test(subject, action, resource, context);
      if (result) {
        return Object.assign({ policyName: policy.name }, result);
      }
    }
    return {
      policyName: 'defaultDeny',
      allowed: false,
      reason: 'No policy allowed this action.'
    };
  }

  /**
   * Expected fields:
   *   subject: { isDesigner: boolean, name: string }
   *   action: create | update | retrieve | delete
   *   resource: {
   *     modelName: 'Action', ...,
   *     record: {} || null
   *     fieldName: 'type', ... || null
   *   }
   *   context: nothing yet
   */
  hasPermission(subject, action, resource, context) {
    const policyResult = this.getPolicyResult(subject, action, resource,
      context);
    const resourceName = resource.record ?
      `${resource.modelName} #${resource.record.id}` :
      `new ${resource.modelName}`;
    const resourceDesc = resource.fieldName ? 
      `on field "${resource.fieldName}" of ${resourceName}` :
      `on ${resourceName}`;
    return Object.assign({
      message: (
        `Action "${action}" ${resourceDesc} by user "${subject.name}" ` +
        `${policyResult.allowed ? 'allowed' : 'denied'}.`
      )
    }, policyResult);
  }
}

module.exports = Policy;
