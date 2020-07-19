const _ = require('lodash');
const moment = require('moment-timezone');

const coreEvaluator = require('fptcore/src/core-evaluator');
const coreRegistry = require('fptcore/src/core-registry');
const ContextCore = require('fptcore/src/cores/context');
const TemplateUtil = require('fptcore/src/utils/template');

const config = require('../config');
const models = require('../models');

class ActionContext {
  /**
   * Create player context with the user and profile objects.
   */
  static _assemblePlayerFields(objs, player) {
    const participantInstance = player.participantId ?
      _.find(objs.participants, u => u.id === player.participantId) :
      null;
    const participant = participantInstance ?
      participantInstance.get({ plain: true }) :
      null;
    if (participant) {
      const profileInstance = participant ? _.find(objs.profiles, {
        participantId: player.participantId,
        experienceId: objs.experience.id,
        roleName: player.roleName,
      }) : null;
      if (profileInstance) {
        participant.profile = profileInstance.get({ plain: true });
      }
    }

    return Object.assign(player.get({ plain: true }), {
      participant: participant
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

  // TODO: remove this code, probably?
  // static prepareActionContext(objs, evaluateAt) {
  //   const acting_player = objs.players.find(player => player.id == objs.acting_player_id);
  //   return {
  //     scriptContent: objs.script.content,
  //     timezone: objs.experience.timezone,
  //     evalContext: this.prepareEvalContext(objs),
  //     evaluateAt: evaluateAt,
  //     currentRoleName: acting_player && acting_player.roleName,
  //     currentPlayerId: acting_player && acting_player.id
  //   };
  // }

  // /**
  //  * Apply an action and gather the results.
  //  */
  // static async getEvalContext(tripId) {
  //   const objs = await this.getObjectsForTrip(tripId);
  //   return this.prepareEvalContext(objs);
  // }

  // static async getActionContext(tripId) {
  //   const objs = await this.getObjectsForTrip(tripId);
  //   return this.prepareActionContext(objs, moment.utc());    
  // }

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
    const participants = await models.Participant.findAll({
      where: { id: _.map(players, 'dataValues.participantId').filter(Boolean) }
    });
    return {
      experience: trip.experience,
      trip: trip,
      players: players,
      script: trip.script,
      profiles: profiles,
      participants: participants
    };
  }

  static async createForTripId(tripId, evaluateAt=null, roleName=null) {
    const actionContext = new ActionContext(tripId, evaluateAt, roleName);
    await actionContext.init();
    return actionContext;
  }

  constructor(tripId, evaluateAt=null, roleName=null) {
    this._tripId = tripId;
    this._evaluateAt = evaluateAt || moment.utc();
    this._currentRoleName = roleName;
  }

  async init() {
    this._objs = await this.constructor.getObjectsForTrip(this._tripId);
    this.registry = coreRegistry;
    this.evaluator = coreEvaluator;
    this.scriptContent = this._objs.script.content;
    this.timezone = this._objs.experience.timezone;
    this.evalContext = this.constructor._prepareEvalContext(this._objs);
    this.evaluateAt = this._evaluateAt;
    this.currentRoleName = this._currentRoleName;
  }

  async findAssetData(assetType, assetName) {
    const asset = await models.Asset.findOne({
      where: {
        experienceId: this._objs.experience.id,
        type: assetType,
        name: assetName,
        isArchived: false
      }
    });
    return asset ? asset.data : null;
  }

  templateText(text) {
    return TemplateUtil.templateText(this.evalContext, text, this.timezone, this.currentRoleName);
  }

  if(ifStatement) {
    return this.evaluator.if(this, ifStatement);
  }
}

module.exports = ActionContext;