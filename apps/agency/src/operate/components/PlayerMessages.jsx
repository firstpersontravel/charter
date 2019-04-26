import _ from 'lodash';
import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { browserHistory } from 'react-router';

import Message from '../partials/Message';

export default class PlayerMessages extends Component {
  constructor(props) {
    super(props);
    this.state = {
      pendingMessage: ''
    };
    this.handleCounterpartChange = this.handleCounterpartChange.bind(this);
    this.handlePendingMessageChange = this.handlePendingMessageChange
      .bind(this);
    this.handleSendPendingMessage = this.handleSendPendingMessage.bind(this);
  }

  componentDidMount() {
    const player = this.props.player;
    this.loadData(player.tripId, player.roleName,
      this.props.params.withRoleName,
      this.props.player.trip.players);
  }

  componentWillReceiveProps(nextProps) {
    // If we've already loaded these props and players have already
    // been loaded, no need to redo
    if (_.isEqual(nextProps.params, this.props.params) &&
        this.props.player.trip.players.length > 0) {
      return;
    }
    this.setState({ pendingMessage: '' });
    const player = nextProps.player;
    this.loadData(player.tripId, player.roleName,
      nextProps.params.withRoleName,
      nextProps.player.trip.players);
  }

  loadData(tripId, roleName, withRoleName, players) {
    if (players.length === 0) {
      return;
    }
    const player1 = _.find(players, {
      tripId: parseInt(tripId, 10),
      roleName: roleName
    });
    if (withRoleName !== 'All') {
      // If with role name was provided, find messages sent by either
      // of the two.
      const player2 = _.find(players, {
        tripId: parseInt(tripId, 10),
        roleName: withRoleName
      });
      this.props.listCollection('messages', {
        orgId: player1.orgId,
        tripId: tripId,
        sentById: [player1.id, player2.id]
      });
    } else {
      // Otherwise, find messages sent to or received by this guy.
      this.props.listCollection('messages', {
        orgId: player1.orgId,
        tripId: tripId,
        sentById: [player1.id]
      });
      this.props.listCollection('messages', {
        orgId: player1.orgId,
        tripId: tripId,
        sentToId: [player1.id]
      });
    }
  }

  handleCounterpartChange(event) {
    const trip = this.props.player.trip;
    browserHistory.push(`/${trip.org.name}/${trip.experience.name}/operate/${trip.groupId}/trip/${trip.id}/players/${this.props.player.roleName}/messages/${event.target.value}`);
  }

  handlePendingMessageChange(event) {
    this.setState({ pendingMessage: event.target.value });
  }

  handleSendPendingMessage(event) {
    event.preventDefault();
    this.setState({ pendingMessage: '' });
    const orgId = this.props.player.orgId;
    const expId = this.props.player.trip.experienceId;
    const tripId = this.props.player.tripId;
    this.props.postAction(orgId, expId, tripId, 'custom_message', {
      from_role_name: this.props.params.roleName,
      to_role_name: this.props.params.withRoleName,
      medium: 'text',
      content: this.state.pendingMessage
    });
  }

  renderSend() {
    // const userRoleName = this.getUserRoleName();
    // const actorRoleName = this.getActorRoleName();
    const script = this.props.player.trip.script;
    const selfRoleName = this.props.params.roleName;
    const selfRole = _.find(script.content.roles, { name: selfRoleName });
    const hasWithRole = this.props.params.withRoleName !== 'All';
    const withRoleName = this.props.params.withRoleName;
    const withRole = _.find(script.content.roles, { name: withRoleName });
    const sendPlaceholder = hasWithRole ?
      `Send message from ${selfRole.title} to ${withRole.title}` :
      `Send message from ${selfRole.title}`;
    const sendLabel = hasWithRole ? `Send to ${withRole.title}` : 'Send';
    const isSendDisabled = !hasWithRole || this.state.pendingMessage === '';

    const relays = _.filter(script.content.relays, relay => (
      relay.as === selfRoleName || relay.with === selfRoleName
    ));
    const counterpartRoleNames = _(relays)
      .map(r => [r.as, r.with])
      .flatten()
      .uniq()
      .value();
    const counterpartRoleOptions = counterpartRoleNames
      .filter(counterpart => counterpart !== selfRoleName)
      .map((counterpart) => {
        const counterpartRole = _.find(script.content.roles, {
          name: counterpart
        });
        return (
          <option key={counterpart} value={counterpart}>
            {counterpartRole.title}
          </option>
        );
      });

    return (
      <form className="row" onSubmit={this.handleSendPendingMessage}>
        <div className="col-sm-3">
          <select
            className="form-control"
            value={this.props.params.withRoleName}
            onChange={this.handleCounterpartChange}>
            <option value="All">All</option>
            {counterpartRoleOptions}
          </select>
        </div>
        <div className="form-group col-sm-6">
          <input
            type="text"
            disabled={!hasWithRole}
            className="form-control"
            id="inputPassword2"
            value={this.state.pendingMessage}
            onChange={this.handlePendingMessageChange}
            placeholder={sendPlaceholder} />
        </div>
        <div className="col-sm-3">
          <button
            type="submit"
            disabled={isSendDisabled}
            className="btn btn-block btn-primary">{sendLabel}</button>
        </div>
      </form>
    );
  }

  renderMessages() {
    if (!this.props.messages.length) {
      return <div>No messages</div>;
    }
    return this.props.messages.map(message => (
      <Message
        key={message.id}
        isInTripContext
        isInRoleContext={this.props.player.roleName}
        updateInstance={this.props.updateInstance}
        message={message} />
    ));
  }

  render() {
    const messagesRendered = this.renderMessages();
    const sendRendered = this.renderSend();
    return (
      <div>
        {sendRendered}
        {messagesRendered}
      </div>
    );
  }
}

PlayerMessages.propTypes = {
  listCollection: PropTypes.func.isRequired,
  postAction: PropTypes.func.isRequired,
  updateInstance: PropTypes.func.isRequired,
  messages: PropTypes.array.isRequired,
  player: PropTypes.object.isRequired,
  params: PropTypes.object.isRequired
};
