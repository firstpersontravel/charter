const _ = require('lodash');

const designerCanRetrieveEverything = {
  name: 'designerCanRetrieveEverything',
  test: (subject, action) => {
    if (!subject.isDesigner) {
      return;
    }
    if (action === 'retrieve') {
      return { allowed: true, reason: 'Designers can read anything.' };
    }
  }
};

const designerCanUpdateScripts = {
  name: 'designerCanUpdateOwnDesigns',
  test: (subject, action, resource) => {
    if (!subject.isDesigner) {
      return;
    }
    const allowedModelNames = ['Experience', 'Script', 'Asset'];
    const allowedActions = ['create', 'update'];
    if (_.includes(allowedModelNames, resource.modelName)) {
      if (_.includes(allowedActions, action)) {
        return { allowed: true, reason: 'Designers can update schedules.' };
      }
    }
  }
};

const designerCanUpdateSchedules = {
  name: 'designerCanUpdateOwnDesigns',
  test: (subject, action, resource) => {
    if (!subject.isDesigner) {
      return;
    }
    const allowedModelNames = ['Group', 'Trip', 'Player'];
    const allowedActions = ['create', 'update'];
    if (_.includes(allowedModelNames, resource.modelName)) {
      if (_.includes(allowedActions, action)) {
        return { allowed: true, reason: 'Designers can update schedules.' };
      }
    }
  }
};

const designerCanUpdateUsers = {
  name: 'designerCanUpdateOwnDesigns',
  test: (subject, action, resource) => {
    if (!subject.isDesigner) {
      return;
    }
    const allowedModelNames = ['User', 'Profile'];
    const allowedActions = ['create', 'update'];
    if (_.includes(allowedModelNames, resource.modelName)) {
      if (_.includes(allowedActions, action)) {
        return { allowed: true, reason: 'Designers can update schedules.' };
      }
    }
  }
};

const designerCanOperateTrips = {
  name: 'designerCanUpdateOwnDesigns',
  test: (subject, action, resource) => {
    if (!subject.isDesigner) {
      return;
    }
    const allowedActions = ['update'];
    const allowedFieldNames = {
      Action: ['isArchived'],
      Message: ['readAt', 'replyReceivedAt', 'isInGallery', 'isArchived'],
      Relay: ['isActive']
    };
    const allowedFieldNamesForResource = allowedFieldNames[resource.modelName];
    if (_.includes(allowedActions, action)) {
      // Must allow action on the generic record (w/o a field name) to get to
      // the checks on each field name.
      if (resource.fieldName === null) {
        return { allowed: true, reason: 'Designers can operate trips.' };
      }
      // Allow specific fields only.
      if (_.includes(allowedFieldNamesForResource, resource.fieldName)) {
        return { allowed: true, reason: 'Designers can operate trips.' };
      }
    }
  }
};

module.exports = [
  designerCanRetrieveEverything,
  designerCanUpdateScripts,
  designerCanUpdateSchedules,
  designerCanUpdateUsers,
  designerCanOperateTrips
];
