const _ = require('lodash');

const ScheduleUtils = {};

ScheduleUtils.filterAssignableProfiles = (
  profiles, users, experienceId, roleName, departureName
) => (
  profiles
    .filter(p => (
      p.isActive &&
      p.experienceId === experienceId &&
      p.roleName === roleName &&
      !p.isArchived &&
      !_.get(_.find(users, { id: p.userId }), 'isArchived')
    ))
    .filter((p) => {
      // Users with no `schedule` property can be used for any schedule.
      if (!p.departureName) {
        return true;
      }
      // Profiles with a `departureName` set can't be assigned to all.
      if (!departureName && p.departureName) {
        return false;
      }
      // Otherwise only return if the schedule matches.
      return p.departureName === departureName;
    })
);

export default ScheduleUtils;
