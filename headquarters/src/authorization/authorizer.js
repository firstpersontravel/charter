const errors = require('../errors');

// Default subject until we have actual user accounts.
const DEFAULT_SUBJECT = { isDesigner: true, name: 'default' };

/**
 * A class to check authorization requests.
 */
class Authorizer {

  constructor(policy) {
    this.policy = policy;
  }

  /**
   * Function to get a subject from a request.
   */
  subjectForReq() {
    return DEFAULT_SUBJECT;
  }

  /**
   * Check permission for a single authz resource.
   */
  checkPermission(subject, action, authzResource) {
    const result = this.policy.hasPermission(subject, action, authzResource);
    if (!result.allowed) {
      throw errors.forbiddenError(result.message);
    }
  }

  /**
   * Generate authz resources for the record and each field, and check all of
   * them.
   */
  checkRecord(req, action, model, record) {
    const subject = this.subjectForReq(req);
    const recordResource = this.authzResource(model, record, null);
    this.checkPermission(subject, action, recordResource);
  }

  /**
   * Generate authz resources for the record and each field, and check all of
   * them.
   */
  checkFields(req, action, model, record, fields) {
    const subject = this.subjectForReq(req);
    for (const fieldName of Object.keys(fields)) {
      const fieldResource = this.authzResource(model, record, fieldName);
      this.checkPermission(subject, action, fieldResource);
    }
  }

  /**
   * Helper function to generate an authz resource.
   */
  authzResource(model, record, fieldName) {
    return {
      modelName: model.name,
      record: record,
      fieldName: fieldName
    };
  }
}

module.exports = Authorizer;
