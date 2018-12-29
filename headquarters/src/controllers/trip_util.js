const _ = require('lodash');

const { ActionPhraseCore, ContextCore } = require('fptcore');

const config = require('../config');
const models = require('../models');

class TripUtil {
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
        scriptName: objs.script.name,
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
  static createEvalContext(objs) {
    const trip = this._assembleTripFields(objs);
    // Only allow custom hosts in production.
    const host = config.env.STAGE === 'production' ? 
      (objs.script.host || config.env.SERVER_HOST_PUBLIC) :
      config.env.SERVER_HOST_PUBLIC;
    const env = { host: host };
    // Create the context.
    return ContextCore.gatherContext(env, trip);
  }

  /**
   * Apply an action and gather the results.
   */
  static async getContext(tripId) {
    const objs = await this.getObjectsForTrip(tripId);
    return this.createEvalContext(objs);
  }

  /**
   * Get objects needed for a trip.
   */
  static async getObjectsForTrip(tripId) {
    // Get trip and players first
    const trip = await models.Trip.find({
      where: { id: tripId },
      include: [{ model: models.Script, as: 'script' }]
    });
    const players = await models.Player.findAll({
      where: { tripId: tripId }
    });
    const profiles = await models.Profile.findAll({
      where: { scriptName: trip.script.name }
    });
    const users = await models.User.findAll({
      where: { id: _.map(players, 'dataValues.userId').filter(Boolean) }
    });
    return {
      trip: trip,
      players: players,
      script: trip.script,
      profiles: profiles,
      users: users
    };
  }

  /**
   * Expand an action phrase in context.
   */
  static async expandActionPhrase(tripId, actionPhrase, evaluateAt) {
    const context = this.getContext(tripId);
    return ActionPhraseCore.expandActionPhrase(actionPhrase, evaluateAt,
      context);
  }
}

module.exports = TripUtil;
