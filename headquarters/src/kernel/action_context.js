const _ = require('lodash');
const moment = require('moment-timezone');

const ContextCore = require('fptcore/src/cores/context');

const config = require('../config');
const models = require('../models');

class ActionContext {
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
  static _prepareEvalContext(objs) {
    const trip = this._assembleTripFields(objs);
    const host = objs.experience.domain || config.env.HQ_PUBLIC_URL;
    const env = { host: host };
    return ContextCore.gatherEvalContext(env, trip);
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

  constructor(tripId, evaluateAt=null, roleName=null) {
    this._tripId = tripId;
    this._evaluateAt = evaluateAt || moment.utc();
    this._currentRoleName = roleName;
  }

  async init() {
    this._objs = await this.constructor.getObjectsForTrip(this._tripId);
    this.scriptContent = this._objs.script.content;
    this.timezone = this._objs.experience.timezone;
    this.evalContext = this.constructor._prepareEvalContext(this._objs);
    this.evaluateAt = this._evaluateAt;
    this.currentRoleName = this._currentRoleName;
  }

  static async createForTripId(tripId, evaluateAt=null, roleName=null) {
    const actionContext = new ActionContext(tripId, evaluateAt, roleName);
    await actionContext.init();
    return actionContext;
  }
}

module.exports = ActionContext;