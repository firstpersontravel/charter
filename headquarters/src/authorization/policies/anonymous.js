const anonymousCanRetrieveParticipants = {
  name: 'anonymousCanRetrieveParticipants',
  test: (subject, action, resource) => {
    // If not anonymous, policy does not apply
    if (!subject.isAnonymous) {
      return;
    }
    // Anonymous can retrieve a participant by ID -- for logging in via the travel app.
    if (action === 'retrieve' && resource.modelName === 'Participant') {
      return { allowed: true, reason: 'Anonymous can retrieve a participant by ID.' };
    }
    return;
  }
};

const anonymousCanListPlayers = {
  name: 'anonymousCanListPlayers',
  test: (subject, action, resource) => {
    // If not anonymous, policy does not apply
    if (!subject.isAnonymous) {
      return;
    }
    // Anonymous can list players, for logging in via the travel app
    if ((action === 'list' || action === 'retrieve') && resource.modelName === 'Player') {
      return { allowed: true, reason: 'Anonymous can list players.' };
    }
    return;
  }
};

module.exports = [
  anonymousCanRetrieveParticipants,
  anonymousCanListPlayers
];
