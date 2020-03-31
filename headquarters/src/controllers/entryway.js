const moment = require('moment-timezone');

const models = require('../models');

const RelayController = require('./relay');
const TripsController = require('./trips');

class EntrywayController {
  /**
   * Update the player to assign a user when starting a new trip
   * for a entryway.
   */
  static async assignActor(experience, trip, role) {
    // If we pass through here, try finding a user for this role.
    const roleProfiles = await models.Profile.findAll({
      where: {
        isActive: true,
        isArchived: false,
        experienceId: experience.id,
        roleName: role.name
      }
    });
    if (!roleProfiles.length) {
      return;
    }
    const matchingProfile = roleProfiles[0];
    // Update role player with this user
    await models.Player.update({ userId: matchingProfile.userId }, {
      where: { tripId: trip.id, roleName: role.name }
    });
  }

  /**
   * Assign each user in the script by role.
   */
  static async assignActors(script, trip) {
    // Find other roles that need to be assigned users
    for (const role of script.content.roles) {
      // Find other roles that need to be assigned users
      // If role doesn't allow being assigned users, or isn't an actor, skip.
      if (role.type !== 'performer') {
        continue;
      }
      await EntrywayController.assignActor(script.experience, trip,
        role);
    }
  }

  /**
   * Create a new trip from an incoming entryway message or call.
   */
  static async createTripFromRelay(entrywayRelay, fromNumber) {
    const script = await RelayController.scriptForRelay(entrywayRelay);
    return this.createTrip(script, entrywayRelay.forRoleName, fromNumber);
  }

  /**
   * Create a new trip with properties.
   */
  static async createTrip(script, userRoleName, userNumber) {
    const localTime = moment.utc().tz(script.experience.timezone);
    const [group, ] = await models.Group.findOrCreate({
      where: {
        orgId: script.orgId,
        experienceId: script.experienceId,
        scriptId: script.id,
        date: localTime.format('YYYY-MM-DD'),
        isArchived: false
      }
    });
    const title = localTime.format('h:mm a z');
    const trip = await TripsController.createTrip(group.id, title,
      ['default']);

    // Look for a user, or create if doesn't exist.
    const [entrywayUser, ] = await models.User.findOrCreate({
      where: {
        orgId: script.orgId,
        experienceId: script.experienceId,
        isActive: true,
        phoneNumber: userNumber
      },
      defaults: { firstName: `${script.experience.title} Player` }
    });

    // Create profile if not already exists
    const [entrywayProfile, ] = await models.Profile.findOrCreate({
      where: {
        userId: entrywayUser.id,
        orgId: script.orgId,
        experienceId: script.experienceId,
        roleName: userRoleName,
        isArchived: false
      },
      defaults: {
        isActive: true,
        isArchived: false,
        firstName: `${script.experience.title} Player`
      }
    });

    if (!entrywayProfile.isActive) {
      await entrywayProfile.update({ isActive: true });
    }

    // Update the entryway player to be assigned to entryway user.
    await models.Player.update({ userId: entrywayUser.id }, {
      where: { tripId: trip.id, roleName: userRoleName }
    });

    // Update all other users
    await EntrywayController.assignActors(script, trip);

    // And return!
    return trip;
  }
}

module.exports = EntrywayController;
