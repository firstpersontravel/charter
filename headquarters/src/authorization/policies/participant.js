const _ = require('lodash');

const participantCanRetrieveExperienceRecords = {
  name: 'participantCanRetrieveExperienceRecords',
  test: (subject, action, resource) => {
    // If not a participant, policy does not apply
    if (!subject.isParticipant) {
      return;
    }
    // If record does not belong to an experience, this rule does not apply
    if (!resource.record.orgId || !resource.record.experienceId) {
      return;
    }
    // If record belongs to a trip, this rule does not apply
    if (resource.record.tripId) {
      return;
    }
    // If resource is not in the participant's experience, policy does not apply
    if (subject.experienceId !== resource.record.experienceId) {
      return;
    }
    if (action === 'retrieve') {
      return { allowed: true, reason: 'Participants can read in own experience.' };
    }
  }
};

const participantCanRetrieveTripRecords = {
  name: 'participantCanRetrieveTripRecords',
  test: (subject, action, resource) => {
    // If not a participant, policy does not apply
    if (!subject.isParticipant) {
      return;
    }
    // If record does not belong to a trip, this rule does not apply
    if (!resource.record.tripId) {
      return;
    }
    // If resource is not in the participant's trips, policy does not apply
    if (!subject.tripIds.includes(resource.record.tripId)) {
      return;
    }
    if (action === 'retrieve') {
      return { allowed: true, reason: 'Players can read in own trip.' };
    }
  }
};

const participantCanUpdateSelf = {
  name: 'participantCanUpdateSelf',
  test: (subject, action, resource) => {
    // If not a participant, policy does not apply
    if (!subject.isParticipant) {
      return;
    }
    // If resource is not a participant, does not apply
    if (resource.modelName !== 'Participant') {
      return;
    }
    // If resource is not one of the participants authorized, does not apply
    if (!subject.participantIds.includes(resource.record.id)) {
      return;
    }
    const allowedActions = ['update'];
    const allowedFieldNames = [
      'locationLatitude',
      'locationLongitude',
      'locationAccuracy',
      'locationTimestamp'
    ];
    if (_.includes(allowedActions, action)) {
      // Must allow action on the generic record (w/o a field name) to get to
      // the checks on each field name.
      if (resource.fieldName === null) {
        return { allowed: true, reason: 'Participants can update self.' };
      }
      // Allow specific fields only.
      if (_.includes(allowedFieldNames, resource.fieldName)) {
        return { allowed: true, reason: 'Participants can update self.' };
      }
    }
  }
};

const participantCanUpdateTrip = {
  name: 'participantCanUpdateTrip',
  test: (subject, action, resource) => {
    // If not a participant, policy does not apply
    if (!subject.isParticipant) {
      return;
    }
    // If record does not belong to a trip, this rule does not apply
    if (!resource.record.tripId) {
      return;
    }
    // If resource is not in the participant's trips, policy does not apply
    if (!subject.tripIds.includes(resource.record.tripId)) {
      return;
    }
    const allowedActions = ['update'];
    const allowedFieldNames = {
      Player: [
        'acknowledgedPageAt',
        'acknowledgedPageName'
      ],
      Trip: []
    };
    const allowedFieldNamesForResource = allowedFieldNames[resource.modelName];
    if (_.includes(allowedActions, action)) {
      // Must allow action on the generic record (w/o a field name) to get to
      // the checks on each field name.
      if (resource.fieldName === null) {
        return { allowed: true, reason: 'Participants can update own trips.' };
      }
      // Allow specific fields only.
      if (_.includes(allowedFieldNamesForResource, resource.fieldName)) {
        return { allowed: true, reason: 'Participants can update own trips.' };
      }
    }
  }
};

const participantCanTriggerTripActions = {
  name: 'participantCanTriggerTripActions',
  test: (subject, action, resource) => {
    // If not a participant, policy does not apply.
    if (!subject.isParticipant) {
      return;
    }
    // If record is not a trip, polict does not apply.
    if (resource.modelName !== 'Trip') {
      return;
    }
    // If trip is not one of the participant's trips, policy does not apply.
    if (!subject.tripIds.includes(resource.record.id)) {
      return;
    }
    const allowedActions = ['action', 'event', 'deviceState'];
    if (allowedActions.includes(action)) {
      return { allowed: true, reason: 'Players can trigger actions in own trip.' };
    }
  }
};

const participantCanTriggerGroupActions = {
  name: 'participantCanTriggerGroupActions',
  test: (subject, action, resource) => {
    // If not a participant, policy does not apply.
    if (!subject.isParticipant) {
      return;
    }
    // If record is not a trip, polict does not apply.
    if (resource.modelName !== 'Group') {
      return;
    }
    // If trip is not one of the participant's trips, policy does not apply.
    if (!subject.groupIds.includes(resource.record.id)) {
      return;
    }
    const allowedActions = ['action', 'event', 'deviceState'];
    if (allowedActions.includes(action)) {
      return { allowed: true, reason: 'Players can trigger actions in own group.' };
    }
  }
};

module.exports = [
  participantCanRetrieveExperienceRecords,
  participantCanRetrieveTripRecords,
  participantCanUpdateSelf,
  participantCanUpdateTrip,
  participantCanTriggerTripActions,
  participantCanTriggerGroupActions
];
