const _ = require('lodash');

const userCanListOrgRecords = {
  name: 'userCanListOrgRecords',
  test: (subject, action, resource) => {
    // If not a user, policy does not apply
    if (!subject.isUser) {
      return;
    }
    // If record does not belong to an org, this rule does not apply
    if (!resource.record.orgId) {
      return;
    }
    // If resource is not in the user's orgs, policy does not apply
    if (!subject.orgIds.includes(Number(resource.record.orgId))) {
      return;
    }
    if (action === 'list') {
      return { allowed: true, reason: 'Users can list in own orgs.' };
    }
  }
};

const userCanRetrieveOrgRecords = {
  name: 'userCanRetrieveOrgRecords',
  test: (subject, action, resource) => {
    // If not a user, policy does not apply
    if (!subject.isUser) {
      return;
    }
    // If record does not belong to an org, this rule does not apply
    if (!resource.record.orgId) {
      return;
    }
    // If resource is not in the user's orgs, policy does not apply
    if (!subject.orgIds.includes(resource.record.orgId)) {
      return;
    }
    if (action === 'retrieve') {
      return { allowed: true, reason: 'Users can read in own orgs.' };
    }
  }
};

const userCanUpdateOrgScripts = {
  name: 'userCanUpdateOrgScripts',
  test: (subject, action, resource) => {
    // If not a user, policy does not apply
    if (!subject.isUser) {
      return;
    }
    // If record does not belong to an org, this rule does not apply
    if (!resource.record.orgId) {
      return;
    }
    // If resource is not in the user's orgs, policy does not apply
    if (!subject.orgIds.includes(resource.record.orgId)) {
      return;
    }
    const allowedModelNames = ['Experience', 'Script', 'Asset'];
    const allowedActions = ['create', 'update'];
    if (_.includes(allowedModelNames, resource.modelName)) {
      if (_.includes(allowedActions, action)) {
        return { allowed: true, reason: 'Users can update scripts.' };
      }
    }
  }
};

const userCanUpdateOrgSchedules = {
  name: 'userCanUpdateOrgSchedules',
  test: (subject, action, resource) => {
    // If not a user, policy does not apply
    if (!subject.isUser) {
      return;
    }
    // If record does not belong to an org, this rule does not apply
    if (!resource.record.orgId) {
      return;
    }
    // If resource is not in the user's orgs, policy does not apply
    if (!subject.orgIds.includes(resource.record.orgId)) {
      return;
    }
    const allowedModelNames = ['Group', 'Trip', 'Player'];
    const allowedActions = ['create', 'update'];
    if (_.includes(allowedModelNames, resource.modelName)) {
      if (_.includes(allowedActions, action)) {
        return { allowed: true, reason: 'Users can update schedules.' };
      }
    }
  }
};

const userCanUpdateOrgParticipants = {
  name: 'userCanUpdateOrgParticipants',
  test: (subject, action, resource) => {
    // If not a user, policy does not apply
    if (!subject.isUser) {
      return;
    }
    // If record does not belong to an org, this rule does not apply
    if (!resource.record.orgId) {
      return;
    }
    // If resource is not in the user's orgs, policy does not apply
    if (!subject.orgIds.includes(resource.record.orgId)) {
      return;
    }
    const allowedModelNames = ['Participant', 'Profile'];
    const allowedActions = ['create', 'update'];
    if (_.includes(allowedModelNames, resource.modelName)) {
      if (_.includes(allowedActions, action)) {
        return { allowed: true, reason: 'Users can update participants.' };
      }
    }
  }
};

const userCanOperateOrgTrips = {
  name: 'userCanOperateOrgTrips',
  test: (subject, action, resource) => {
    // If not a user, policy does not apply
    if (!subject.isUser) {
      return;
    }
    // If record does not belong to an org, this rule does not apply
    if (!resource.record.orgId) {
      return;
    }
    // If resource is not in the user's orgs, policy does not apply
    if (!subject.orgIds.includes(resource.record.orgId)) {
      return;
    }
    const allowedActions = ['update'];
    const allowedFieldNames = {
      Action: ['isArchived', 'scheduledAt'],
      Message: ['readAt', 'replyReceivedAt', 'isInGallery', 'isArchived'],
      Relay: ['isActive']
    };
    const allowedFieldNamesForResource = allowedFieldNames[resource.modelName];
    if (_.includes(allowedActions, action)) {
      // Must allow action on the generic record (w/o a field name) to get to
      // the checks on each field name.
      if (resource.fieldName === null) {
        return { allowed: true, reason: 'Users can operate trips.' };
      }
      // Allow specific fields only.
      if (_.includes(allowedFieldNamesForResource, resource.fieldName)) {
        return { allowed: true, reason: 'Users can operate own trips.' };
      }
    }
  }
};

const userCanAdministrateOrgTrips = {
  name: 'userCanAdministrateOrgTrips',
  test: (subject, action, resource) => {
    // If not a user, policy does not apply
    if (!subject.isUser) {
      return;
    }
    // If record is not a trip, policy does not apply.
    if (resource.modelName !== 'Trip') {
      return;
    }
    // If resource is not in the user's orgs, policy does not apply
    if (!subject.orgIds.includes(resource.record.orgId)) {
      return;
    }
    const allowedActions = [
      'action',
      'event',
      'reset',
      'notify',
      'trigger'
    ];
    if (_.includes(allowedActions, action)) {
      return { allowed: true, reason: 'Users can administrate own trips.' };
    }
  }
};

module.exports = [
  userCanListOrgRecords,
  userCanRetrieveOrgRecords,
  userCanUpdateOrgScripts,
  userCanUpdateOrgSchedules,
  userCanUpdateOrgParticipants,
  userCanOperateOrgTrips,
  userCanAdministrateOrgTrips
];
