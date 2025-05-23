const moment = require('moment-timezone');

const RoleCore = require('fptcore/src/cores/role');

const models = require('../models');

const TripsController = require('./trips');

class EntrywayController {
  /**
   * Update the player to assign a participant when starting a new trip
   * for a entryway.
   */
  static async assignActor(experience, trip, role) {
    // If we pass through here, try finding a participant for this role.
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
    // Update role player with this participant
    await models.Player.update({ participantId: matchingProfile.participantId }, {
      where: { tripId: trip.id, roleName: role.name }
    });
  }

  /**
   * Assign each participant in the script by role.
   */
  static async assignActors(script, trip, enteredRoleName) {
    // Find other roles that need to be assigned participants
    for (const role of script.content.roles) {
      // Ignore participant role that started the experience
      if (role.name === enteredRoleName) {
        continue;
      }
      // Find other roles that need to be assigned participants
      // If role doesn't allow being assigned participants, or isn't an actor, skip.
      if (!RoleCore.canRoleHaveParticipant(script.content, role)) {
        continue;
      }
      await EntrywayController.assignActor(script.experience, trip, role);
    }
  }

  /**
   * Create a new trip with properties.
   */
  static async createTripFromEntryway(script, participantRoleName, participantNumber, participantName=null) {
    const localTime = moment.utc().tz(script.experience.timezone);
    const title = participantName || localTime.format('h:mm a z');
    const defaultVariantNames = (script.content.variants || [])
      .filter(v => v.default)
      .map(v => v.name);
    const trip = await TripsController.createTrip(script.experienceId, title,
      defaultVariantNames);

    // Look for a participant, or create if doesn't exist.
    const participantWhere = {
      orgId: script.orgId,
      experienceId: script.experienceId,
      isArchived: false,
    };
    const participantDefaults = {
      createdAt: moment.utc(),
      name: participantName || `${script.experience.title} Player`
    };
    if (participantNumber) {
      participantWhere.phoneNumber = participantNumber;
    } else {
      participantWhere.phoneNumber = 'IMPOSSIBLE';
      participantDefaults.phoneNumber = participantNumber;
    }
    const [entrywayParticipant, ] = await models.Participant.findOrCreate({
      where: participantWhere,
      defaults: participantDefaults
    });

    // Create profile if not already exists
    const [entrywayProfile, ] = await models.Profile.findOrCreate({
      where: {
        participantId: entrywayParticipant.id,
        orgId: script.orgId,
        experienceId: script.experienceId,
        roleName: participantRoleName,
        isArchived: false
      },
      defaults: {
        isActive: true,
        isArchived: false
      }
    });

    if (!entrywayProfile.isActive) {
      await entrywayProfile.update({ isActive: true });
    }

    // Update the entryway player to be assigned to entryway participant.
    await models.Player.update({ participantId: entrywayParticipant.id }, {
      where: { tripId: trip.id, roleName: participantRoleName }
    });

    // Update all other participants
    await EntrywayController.assignActors(script, trip, participantRoleName);

    // And return!
    return trip;
  }
}

module.exports = EntrywayController;
