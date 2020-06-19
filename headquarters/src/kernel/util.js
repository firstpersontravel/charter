const _ = require('lodash');
const moment = require('moment');

const ContextCore = require('fptcore/src/cores/context');

const config = require('../config');
const models = require('../models');

class KernelUtil {
  /**
   * Create player context with the user and profile objects.
   */
  static _assemblePlayerFields(objs, player) {
    const userInstance = player.userId ?
      _.find(objs.users, u => u.id === player.userId) :
      null;
    const user = userInstance ? userInstance.get({ plain: true }) : null;
    if (user) {
      const profileInstance = user ? _.find(objs.profiles, {
        userId: player.userId,
        experienceId: objs.experience.id,
        roleName: player.roleName,
      }) : null;
      if (profileInstance) {
        user.profile = profileInstance.get({ plain: true });
      }
    }

    return Object.assign(player.get({ plain: true }), {
      user: user
    });
  }

  static _assembleTripFields(objs) {
    const trip = objs.trip.get({ plain: true });
    return Object.assign(trip, {
      script: objs.script.get({ plain: true }),
      players: _.map(objs.players, player => (
        this._assemblePlayerFields(objs, player)
      ))
    });
  }

  /**
   * Create trip context suitable for passing into the action parser.
   */
  static prepareEvalContext(objs) {
    const trip = this._assembleTripFields(objs);
    const host = objs.experience.domain || config.env.HQ_PUBLIC_URL;
    const env = { host: host };
    // Create the context.
    return ContextCore.gatherEvalContext(env, trip);
  }

  static prepareActionContext(objs, evaluateAt) {
    return {
      scriptContent: objs.script.content,
      timezone: objs.experience.timezone,
      evalContext: this.prepareEvalContext(objs),
      evaluateAt: evaluateAt,
      currentRoleName: null
    };
  }

  /**
   * Apply an action and gather the results.
   */
  static async getEvalContext(tripId) {
    const objs = await this.getObjectsForTrip(tripId);
    return this.prepareEvalContext(objs);
  }

  static async getActionContext(tripId) {
    const objs = await this.getObjectsForTrip(tripId);
    return this.prepareActionContext(objs, moment.utc());    
  }

  /**
   * Get objects needed for a trip.
   */
  static async getObjectsForTrip(tripId) {
    // Get trip and players first
    const trip = await models.Trip.findOne({
      where: { id: tripId },
      include: [
        { model: models.Script, as: 'script' },
        { model: models.Org, as: 'org' },
        { model: models.Experience, as: 'experience' }
      ]
    });
    if (!trip) {
      throw new Error(`Trip ${tripId} not found.`);
    }
    const players = await models.Player.findAll({
      where: { tripId: tripId }
    });
    const profiles = await models.Profile.findAll({
      where: { experienceId: trip.experienceId }
    });
    const users = await models.User.findAll({
      where: { id: _.map(players, 'dataValues.userId').filter(Boolean) }
    });
    return {
      experience: trip.experience,
      trip: trip,
      players: players,
      script: trip.script,
      profiles: profiles,
      users: users
    };
  }
}

module.exports = KernelUtil;
