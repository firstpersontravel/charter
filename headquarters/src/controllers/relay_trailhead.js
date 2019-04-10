const moment = require('moment-timezone');

const models = require('../models');

const RelayController = require('./relay');
const TripsController = require('./trips');

class RelayTrailheadController {
  /**
   * Update the player to assign a user when starting a new trip
   * for a trailhead.
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
      await RelayTrailheadController.assignActor(script.experience, trip,
        role);
    }
  }

  /**
   * Create a new trip from an incoming trailhead message or call.
   */
  static async createTrip(trailheadRelay, fromNumber) {
    const script = await RelayController.scriptForRelay(trailheadRelay);
    const localTime = moment.utc().tz(script.experience.timezone);
    const [group, ] = await models.Group.findOrCreate({
      where: {
        orgId: script.orgId,
        experienceId: script.experience.id,
        scriptId: script.id,
        date: localTime.format('YYYY-MM-DD'),
        isArchived: false
      }
    });
    const title = localTime.format('h:mm a z');
    const trip = await TripsController.createTrip(
      group.id, title, trailheadRelay.departureName, ['default']);

    // Look for a user, or create if doesn't exist.
    const [trailheadUser, ] = await models.User.findOrCreate({
      where: {
        orgId: trailheadRelay.orgId,
        experienceId: trailheadRelay.experienceId,
        isActive: true,
        phoneNumber: fromNumber
      },
      defaults: { firstName: `${script.experience.title} Player` }
    });

    // Create profile if not already exists
    const [trailheadProfile, ] = await models.Profile.findOrCreate({
      where: {
        userId: trailheadUser.id,
        orgId: trailheadRelay.orgId,
        experienceId: trailheadRelay.experienceId,
        roleName: trailheadRelay.forRoleName,
        isArchived: false
      },
      defaults: {
        isActive: true,
        isArchived: false,
        firstName: `${script.experience.title} Player`
      }
    });

    if (!trailheadProfile.isActive) {
      await trailheadProfile.update({ isActive: true });
    }

    // Update the trailhead player to be assigned to trailhead user.
    await models.Player.update({ userId: trailheadUser.id }, {
      where: {
        tripId: trip.id,
        roleName: trailheadRelay.forRoleName
      }
    });

    // Update all other users
    await RelayTrailheadController.assignActors(script, trip);

    // And return!
    return trip;
  }
}

module.exports = RelayTrailheadController;
