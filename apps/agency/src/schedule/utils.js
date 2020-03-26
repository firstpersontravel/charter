const _ = require('lodash');

class ScheduleUtils {
  static filterAssignableProfiles(profiles, users, experienceId, roleName) {
    return profiles.filter(p => (
      p.isActive &&
      p.experienceId === experienceId &&
      p.roleName === roleName &&
      !p.isArchived &&
      !_.get(_.find(users, { id: p.userId }), 'isArchived')
    ));
  }
}

export default ScheduleUtils;
