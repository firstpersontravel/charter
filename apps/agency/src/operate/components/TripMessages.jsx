import _ from 'lodash';
import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { browserHistory } from 'react-router';

import Message from '../partials/Message';

export default class TripMessages extends Component {
  constructor(props) {
    super(props);
    this.state = {
      pendingMessage: ''
    };
    this.handleRoleChange = this.handleRoleChange.bind(this);
    this.handleCounterpartChange = this.handleCounterpartChange.bind(this);
    this.handlePendingMessageChange = this.handlePendingMessageChange
      .bind(this);
    this.handleSendPendingMessage = this.handleSendPendingMessage.bind(this);
  }

  componentDidMount() {
    this.loadData(this.props.trip, this.props.location.query.for,
      this.props.location.query.with);
  }

  componentWillReceiveProps(nextProps) {
    // If we've already loaded these props and players have already
    // been loaded, no need to redo
    if (_.isEqual(nextProps.location.query, this.props.location.query) &&
        this.props.trip.players.length > 0) {
      return;
    }
    this.setState({ pendingMessage: '' });
    this.loadData(nextProps.trip, nextProps.location.query.for,
      nextProps.location.query.with);
  }

  loadData(trip, forRoleName, withRoleName) {
    if (trip.players.length === 0) {
      return;
    }

    if (!forRoleName) {
      // Otherwise, find all messages
      this.props.listCollection('messages', {
        orgId: trip.orgId,
        tripId: trip.id
      });
      return;
    }

    const forPlayer = _.find(trip.players, {
      tripId: parseInt(trip.id, 10),
      roleName: forRoleName
    });

    if (!withRoleName) {
      this.props.listCollection('messages', {
        orgId: forPlayer.orgId,
        tripId: trip.id,
        sentById: [forPlayer.id]
      });
      this.props.listCollection('messages', {
        orgId: forPlayer.orgId,
        tripId: trip.id,
        sentToId: [forPlayer.id]
      });
      return;
    }

    // If both role names was provided, find messages sent by either
    // of the two.
    const withPlayer = _.find(trip.players, {
      tripId: parseInt(trip.id, 10),
      roleName: withRoleName
    });

    this.props.listCollection('messages', {
      orgId: forPlayer.orgId,
      tripId: trip.id,
      sentById: [forPlayer.id, withPlayer.id]
    });
  }

  handleRoleChange(event) {
    const trip = this.props.trip;
    browserHistory.push(`/${trip.org.name}/${trip.experience.name}/operate/${trip.groupId}/trip/${trip.id}/messages?for=${event.target.value}`);
  }

  handleCounterpartChange(event) {
    const trip = this.props.trip;
    browserHistory.push(`/${trip.org.name}/${trip.experience.name}/operate/${trip.groupId}/trip/${trip.id}/messages?for=${this.props.location.query.for}&with=${event.target.value}`);
  }

  handlePendingMessageChange(event) {
    this.setState({ pendingMessage: event.target.value });
  }

  handleSendPendingMessage(event) {
    event.preventDefault();
    this.setState({ pendingMessage: '' });
    const orgId = this.props.trip.orgId;
    const expId = this.props.trip.experienceId;
    const tripId = this.props.trip.id;
    this.props.postAction(orgId, expId, tripId, 'send_text', {
      from_role_name: this.props.location.query.for,
      to_role_name: this.props.location.query.with,
      content: this.state.pendingMessage
    });
  }

  renderSendPlaceholder() {
    if (!this.props.location.query.for) {
      return 'Send message';
    }
    const script = this.props.trip.script;
    const selfRoleName = this.props.location.query.for;
    const selfRole = _.find(script.content.roles, { name: selfRoleName });
    if (!this.props.location.query.with) {
      return `Send message from ${selfRole.title}`;
    }
    const withRoleName = this.props.location.query.with;
    const withRole = _.find(script.content.roles, { name: withRoleName });
    return `Send message from ${selfRole.title} to ${withRole.title}`;
  }

  renderForRoleOptions() {
    const script = this.props.trip.script;
    return _(script.content.relays)
      .map(relay => relay.for)
      .uniq()
      .map((roleName) => {
        const role = _.find(script.content.roles, { name: roleName });
        return (
          <option key={roleName} value={roleName}>
            For {role.title}
          </option>
        );
      })
      .value();
  }

  renderWithRoleOptions() {
    const script = this.props.trip.script;
    const selfRoleName = this.props.location.query.for;
    if (!selfRoleName) {
      return [];
    }
    const relays = _.filter(script.content.relays, relay => (
      relay.as === selfRoleName || relay.with === selfRoleName
    ));

    const withRoleNames = _(relays)
      .map(r => [r.as, r.with])
      .flatten()
      .uniq()
      .value();

    return withRoleNames
      .filter(withRoleName => withRoleName !== selfRoleName)
      .map((withRoleName) => {
        const withRole = _.find(script.content.roles, { name: withRoleName });
        return (
          <option key={withRoleName} value={withRoleName}>
            With {withRole.title}
          </option>
        );
      });
  }

  renderSend() {
    const script = this.props.trip.script;
    const hasRole = !!this.props.location.query.for;
    const hasWithRole = !!this.props.location.query.with;
    const withRoleName = this.props.location.query.with;
    const withRole = _.find(script.content.roles, { name: withRoleName });
    const sendPlaceholder = this.renderSendPlaceholder();
    const sendLabel = hasWithRole ? `Send to ${withRole.title}` : 'Send';
    const isSendDisabled = !hasRole || !hasWithRole ||
      !this.state.pendingMessage;
    const forRoleOptions = this.renderForRoleOptions();
    const withRoleOptions = this.renderWithRoleOptions();
    return (
      <form className="row" onSubmit={this.handleSendPendingMessage}>
        <div className="col-sm-2">
          <select
            className="form-control"
            value={this.props.location.query.for}
            onChange={this.handleRoleChange}>
            <option value="">For all</option>
            {forRoleOptions}
          </select>
        </div>
        <div className="col-sm-2">
          <select
            className="form-control"
            value={this.props.location.query.with}
            onChange={this.handleCounterpartChange}>
            <option value="">With all</option>
            {withRoleOptions}
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
        <div className="col-sm-2">
          <button
            type="submit"
            disabled={isSendDisabled}
            className="btn btn-block constrain-text btn-primary">
            {sendLabel}
          </button>
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
        isInRoleContext={this.props.location.query.for || null}
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

TripMessages.propTypes = {
  listCollection: PropTypes.func.isRequired,
  postAction: PropTypes.func.isRequired,
  updateInstance: PropTypes.func.isRequired,
  messages: PropTypes.array.isRequired,
  trip: PropTypes.object.isRequired,
  location: PropTypes.object.isRequired
};
