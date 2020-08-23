const errors = require('../../errors');

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
  subjectForReq(req) {
    // If a user, use that first.
    if (req.auth && req.auth.user) {
      return {
        isUser: true,
        name: req.auth.user.email,
        orgIds: req.auth.user.orgRoles.map(orgRole => orgRole.orgId)
      };
    }
    // Then participant
    if (req.auth && req.auth.participant) {
      return {
        isParticipant: true,
        name: req.auth.participant.name,
        orgId: req.auth.participant.orgId,
        experienceId: req.auth.participant.experienceId,
        tripIds: req.auth.players.map(player => player.tripId)
      };
    }
    // Then trip
    if (req.auth && req.auth.trip) {
      return {
        isParticipant: true,
        name: req.auth.trip.title,
        orgId: req.auth.trip.orgId,
        experienceId: req.auth.trip.experienceId,
        tripIds: [req.auth.trip.id]
      };
    }
    // Then anonymous
    return {
      isAnonymous: true,
      name: 'anonymous'
    };
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
