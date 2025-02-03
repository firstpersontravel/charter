import moment from 'moment';

// eslint-disable-next-line import/no-extraneous-dependencies
import fptCore from 'fptcore';

export default class Evaluator {
  constructor(state, playerId) {
    this.state = state;
    this.playerId = playerId;
  }

  getScriptContent() {
    return this.state.script.content;
  }

  getPlayer() {
    return this.state.players.find(p => p.id === this.playerId);
  }

  getActionContext() {
    const player = this.getPlayer();
    return {
      scriptContent: this.state.script.content,
      evalContext: this.getEvalContext(),
      evaluateAt: moment.utc(),
      timezone: this.state.experience.timezone,
      triggeringPlayerId: player ? player.id : 0,
      triggeringRoleName: player ? player.roleName : ''
    };
  }

  getCombinedTripData() {
    return Object.assign({}, this.state.trip, {
      players: this.state.players.map((player) => {
        const combinedPlayer = Object.assign({}, player);
        const participant = this.state.participants.find(p => p.id === player.participantId);
        if (participant) {
          combinedPlayer.participant = Object.assign({}, participant);
          const profile = this.state.profiles.find(p => p.participantId === participant.id);
          if (profile) {
            combinedPlayer.participant.profile = Object.assign({}, profile);
          }
        }
        return combinedPlayer;
      })
    });
  }

  getEvalContext() {
    const trip = this.getCombinedTripData();
    return fptCore.ContextCore.gatherEvalContext({ host: '' }, trip);
  }

  humanizeText(text) {
    return fptCore.TemplateUtil.templateText(
      this.getEvalContext(),
      text,
      this.state.experience.timezone,
      this.getPlayer().roleName
    );
  }

  evaluateIf(ifClause) {
    return fptCore.coreEvaluator.if(this.getActionContext(), ifClause);
  }

  lookupRef(ref) {
    return fptCore.TemplateUtil.lookupRef(this.getEvalContext(), ref);
  }
}
