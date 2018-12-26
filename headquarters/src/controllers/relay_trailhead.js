const moment = require('moment-timezone');

const config = require('../config');
const models = require('../models');

const RelayController = require('./relay');
const TripsController = require('./trips');
const TripRelaysController = require('./trip_relays');

const RelayTrailheadController = {};

/**
 * Update the player to assign a user when starting a new trip
 * for a trailhead.
 */
RelayTrailheadController.assignActor = async (script, trip, role) => {
  // If we pass through here, try finding a user for this role.
  const roleProfiles = await models.Profile.findAll({
    where: {
      isActive: true,
      isArchived: false,
      scriptName: script.name,
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
  // Send admin message
  const host = config.env.SERVER_HOST_PUBLIC;
  const actorUrl = `${host}/actor/${matchingProfile.userId}`;
  const castMessage = (
    `New trip for ${script.title} as ${role.name}: ${actorUrl}`
  );
  await (
    TripRelaysController.sendAdminMessage(trip, role.name, castMessage)
  );
};

/**
 * Assign each user in the script by role.
 */
RelayTrailheadController.assignActors = async (script, trip) => {
  // Find other roles that need to be assigned users
  for (const role of script.content.roles) {
    // Find other roles that need to be assigned users
    // If role doesn't allow being assigned users, or isn't an actor, skip.
    if (!role.user || !role.actor) {
      continue;
    }
    await RelayTrailheadController.assignActor(script, trip, role);
  }
};

/**
 * Create a new trip from an incoming trailhead message or call.
 */
RelayTrailheadController.createTrip = async (trailheadRelay, fromNumber) => {
  const script = await RelayController.scriptForRelay(trailheadRelay);
  const localTime = moment.utc().tz(script.timezone);
  const [group, ] = await models.Group.findOrCreate({
    where: {
      scriptId: script.id,
      date: localTime.format('YYYY-MM-DD'),
      isArchived: false
    }
  });
  const title = localTime.format('h:mm a z');
  const trip = await TripsController.createWithDefaults(
    group.id, title, trailheadRelay.departureName, ['default']);

  // Look for a user, or create if doesn't exist.
  const [trailheadUser, ] = await models.User.findOrCreate({
    where: { isActive: true, phoneNumber: fromNumber },
    defaults: { firstName: `${script.title} Player` }
  });

  // Create profile if not already exists
  const [trailheadProfile, ] = await models.Profile.findOrCreate({
    where: {
      userId: trailheadUser.id,
      scriptName: script.name,
      roleName: trailheadRelay.forRoleName,
      isArchived: false
    },
    defaults: {
      isActive: true,
      isArchived: false,
      firstName: `${script.title} Player`
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
};

module.exports = RelayTrailheadController;
