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
    this.loadData(this.props.params, this.props.player.trip.players);
  }

  componentWillReceiveProps(nextProps) {
    // If we've already loaded these props and players have already
    // been loaded, no need to redo
    if (_.isEqual(nextProps.params, this.props.params) &&
        this.props.player.trip.players.length > 0) {
      return;
    }
    this.setState({ pendingMessage: '' });
    this.loadData(nextProps.params, nextProps.player.trip.players);
  }

  getUserRoleName() {
    const script = this.props.player.trip.script;
    const role = _.find(script.content.roles,
      { name: this.props.params.roleName });
    return role.actor ? this.props.params.withRoleName :
      this.props.params.roleName;
  }

  getActorRoleName() {
    const userRoleName = this.getUserRoleName();
    return userRoleName === this.props.params.withRoleName ?
      this.props.params.roleName : this.props.params.withRoleName;
  }

  loadData(params, players) {
    if (players.length === 0) {
      return;
    }
    const player1 = _.find(players, {
      tripId: parseInt(params.tripId, 10),
      roleName: params.roleName
    });
    if (params.withRoleName !== 'All') {
      // If with role name was provided, find messages sent by either
      // of the two.
      const player2 = _.find(players, {
        tripId: parseInt(params.tripId, 10),
        roleName: params.withRoleName
      });
      this.props.listCollection('messages', {
        tripId: params.tripId,
        sentById: [player1.id, player2.id]
      });
    } else {
      // Otherwise, find messages sent to or received by this guy.
      this.props.listCollection('messages', {
        tripId: params.tripId,
        sentById: [player1.id]
      });
      this.props.listCollection('messages', {
        tripId: params.tripId,
        sentToId: [player1.id]
      });
    }
  }

  handleCounterpartChange(event) {
    browserHistory.push(`/operate/${this.props.params.groupId}/trip/${this.props.params.tripId}/players/${this.props.params.roleName}/messages/${event.target.value}`);
  }

  handlePendingMessageChange(event) {
    this.setState({ pendingMessage: event.target.value });
  }

  handleSendPendingMessage(event) {
    event.preventDefault();
    this.setState({ pendingMessage: '' });
    this.props.postAction(this.props.params.tripId, 'custom_message', {
      from_role_name: this.getActorRoleName(),
      to_role_name: this.getUserRoleName(),
      message_type: 'text',
      message_content: this.state.pendingMessage
    });
  }

  renderSend() {
    const userRoleName = this.getUserRoleName();
    const actorRoleName = this.getActorRoleName();
    const isSendDisabled = (
      this.props.params.withRoleName === 'All' ||
      this.state.pendingMessage === '');

    const relays = _.filter(this.props.player.trip.script.content.relays,
      { as: this.props.params.roleName });
    const counterparts = _.uniq(relays.map(relay => relay.with));
    const counterpartOptions = counterparts.map(counterpart => (
      <option key={counterpart} value={counterpart}>{counterpart}</option>
    ));

    return (
      <form className="row" onSubmit={this.handleSendPendingMessage}>
        <div className="col-sm-3">
          <select
            className="form-control"
            value={this.props.params.withRoleName}
            onChange={this.handleCounterpartChange}>
            <option value="All">All</option>
            {counterpartOptions}
          </select>
        </div>
        <div className="form-group col-sm-6">
          <input
            type="text"
            disabled={this.props.params.withRoleName === 'All'}
            className="form-control"
            id="inputPassword2"
            value={this.state.pendingMessage}
            onChange={this.handlePendingMessageChange}
            placeholder={`Send message from ${actorRoleName} to ${userRoleName}`} />
        </div>
        <div className="col-sm-3">
          <button
            type="submit"
            disabled={isSendDisabled}
            className="btn btn-block btn-primary">Send</button>
        </div>
      </form>
    );
  }

  renderMessages() {
    if (!this.props.messages.length) {
      return <div>No messages</div>;
    }
    return _.sortBy(this.props.messages, 'createdAt')
      .reverse()
      .map(message => (
        <Message
          key={message.id}
          updateInstance={this.props.updateInstance}
          trip={this.props.player.trip}
          message={message} />
      ));
  }

  render() {
    const messagesRendererd = this.renderMessages();
    const sendRendered = this.renderSend();
    return (
      <div>
        {sendRendered}
        {messagesRendererd}
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
