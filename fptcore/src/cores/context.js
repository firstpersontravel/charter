var _ = require('lodash');
var moment = require('moment');

class ContextCore {
  /**
   * Gather context for a player.
   */
  static gatherPlayerEvalContext(env, trip, player) {
    var user = player.user || {};
    var profile = user.profile || {};
    var role = _.find(_.get(trip, 'script.content.roles') || [],
      { name: player.roleName }) || {};
    var page = _.find(_.get(trip, 'script.content.pages') || [],
      { name: player.currentPageName }) || {};
    var link = (env.host || '') + '/s/' + player.id;
    var fullName = user.lastName ?
      (user.firstName + ' ' + user.lastName) :
      user.firstName;
    var contactName = role.title || fullName || null;
    return _.assign({}, profile.values, {
      currentPageName: player.currentPageName || null,
      link: link,
      email: profile.email || user.email || null,
      contact_name: contactName,
      photo: profile.photo || null,
      facetime: profile.facetimeUsername || null,
      skype: profile.skypeUsername || null,
      phone_number: profile.phoneNumber || user.phoneNumber || null,
      directive: page && page.directive || null
    });
  }

  /**
   * Get the role slug for a given role.
   */
  static slugForRole(role) {
    if (!role || !role.title) {
      return null;
    }
    return role.title
      .toLowerCase()
      .replace(/\s+/g, '_')
      .replace(/[^\w]/g, '');
  }

  /**
   * Gather all context for a trip.
   */
  static gatherEvalContext(env, trip) {
    // Gather core values
    var context = _.assign({}, trip.customizations, trip.values, {
      date: moment.utc(trip.date, 'YYYY-MM-DD').format('dddd, MMMM D'),
      currentSceneName: trip.currentSceneName,
      waypointOptions: trip.waypointOptions,
      schedule: trip.schedule,
      history: trip.history
    });
    // Add waypoint values if present
    var waypointNames = Object.keys(trip.waypointOptions || {});
    _.each(waypointNames, (waypointName) => {
      var waypoints = trip.script.content.waypoints;
      var waypoint = _.find(waypoints, { name: waypointName });
      if (!waypoint) {
        return;
      }
      var optionName = trip.waypointOptions[waypointName];
      var option = _.find(waypoint.options, { name: optionName });
      if (!option) {
        return;
      }
      if (option.values) {
        _.assign(context, option.values);
      }
    });
    // Add player values
    var roles = _.get(trip, 'script.content.roles') || [];
    _.each(trip.players, (player) => {
      var role = _.find(roles, { name: player.roleName });
      var roleSlug = this.slugForRole(role);
      var playerContext = this.gatherPlayerEvalContext(env, trip, player);
      if (roleSlug) {
        context[roleSlug] = playerContext;
      }
      // LEGACY: for legacy role names that were determined by old scripts
      // (like headlands gamble), put the player context in as the old role name.
      // This means {{Player.directive}} will still work without requiring a
      // change at the moment to {{player.directive}}.
      if (player.roleName.indexOf('-') === -1) {
        context[player.roleName] = playerContext;
      }
    });
    return context;
  }
}

module.exports = ContextCore;
