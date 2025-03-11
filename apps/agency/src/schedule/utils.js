const _ = require('lodash');

class ScheduleUtils {
  static filterAssignableProfiles(profiles, participants, experienceId, roleName) {
    return profiles.filter(p => (
      p.isActive
      && p.experienceId === experienceId
      && p.roleName === roleName
      && !p.isArchived
      && !_.get(_.find(participants, { id: p.participantId }), 'isArchived')
    ));
  }
}

export default ScheduleUtils;
