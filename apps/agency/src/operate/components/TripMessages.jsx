import _ from 'lodash';
import React, { Component } from 'react';
import PropTypes from 'prop-types';

import Message from '../partials/Message';

export default class TripMessages extends Component {
  constructor(props) {
    super(props);
    this.state = { pendingMessage: '' };
    this.handleRoleChange = this.handleRoleChange.bind(this);
    this.handleCounterpartChange = this.handleCounterpartChange.bind(this);
    this.handlePendingMessageChange = this.handlePendingMessageChange
      .bind(this);
    this.handleSendPendingMessage = this.handleSendPendingMessage.bind(this);
  }

  componentDidMount() {
    const query = new URLSearchParams(this.props.location.query);
    this.loadData(this.props.trip, query.get('for'), query.get('with'));
  }

  componentWillReceiveProps(nextProps) {
    // If we've already loaded these props and players have already
    // been loaded, no need to redo
    if (_.isEqual(nextProps.location.search, this.props.location.search)
        && this.props.trip.players.length > 0) {
      return;
    }
    this.setState({ pendingMessage: '' });
    const query = new URLSearchParams(nextProps.location.query);
    this.loadData(nextProps.trip, query.get('for'), query.get('with'));
  }

  loadData(trip, forRoleName, withRoleName) {
    if (!forRoleName) {
      // Otherwise, find all messages
      this.props.listCollection('messages', {
        orgId: trip.orgId,
        tripId: trip.id
      });
      return;
    }

    // If only one role, find all messages to or from that role
    if (!withRoleName) {
      this.props.listCollection('messages', {
        orgId: trip.orgId,
        tripId: trip.id,
        fromRoleName: forRoleName
      });
      this.props.listCollection('messages', {
        orgId: trip.orgId,
        tripId: trip.id,
        toRoleName: forRoleName
      });
      return;
    }

    // If both role names was provided, find messages sent by either
    // of the two.
    this.props.listCollection('messages', {
      orgId: trip.orgId,
      tripId: trip.id,
      fromRoleName: [forRoleName, withRoleName]
    });
  }

  handleRoleChange(event) {
    const { trip } = this.props;
    this.props.history.push(
      `/${trip.org.name}/${trip.experience.name}/operate/`
      + `trip/${trip.id}/messages?for=${event.target.value}`
    );
  }

  handleCounterpartChange(event) {
    const query = new URLSearchParams(this.props.location.search);
    const { trip } = this.props;
    this.props.history.push(
      `/${trip.org.name}/${trip.experience.name}/operate/`
      + `trip/${trip.id}/messages`
      + `?for=${query.get('for')}&with=${event.target.value}`
    );
  }

  handlePendingMessageChange(event) {
    this.setState({ pendingMessage: event.target.value });
  }

  handleSendPendingMessage(event) {
    event.preventDefault();
    this.setState({ pendingMessage: '' });
    const { orgId } = this.props.trip;
    const expId = this.props.trip.experienceId;
    const tripId = this.props.trip.id;
    const query = new URLSearchParams(this.props.location.search);
    this.props.postAction(orgId, expId, tripId, 'send_text', {
      from_role_name: query.get('for'),
      to_role_name: query.get('with'),
      content: this.state.pendingMessage
    });
  }

  renderSendPlaceholder() {
    const query = new URLSearchParams(this.props.location.search);
    if (!query.get('for')) {
      return 'Send message';
    }
    const { script } = this.props.trip;
    const selfRoleName = query.get('for');
    const selfRole = _.find(script.content.roles, { name: selfRoleName });
    if (!query.get('with')) {
      return `Send message from ${selfRole.title}`;
    }
    const withRoleName = query.get('with');
    const withRole = _.find(script.content.roles, { name: withRoleName });
    return `Send message from ${selfRole.title} to ${withRole.title}`;
  }

  renderForRoleOptions() {
    const { script } = this.props.trip;
    return script.content.roles.map(role => (
      <option key={role.name} value={role.name}>
        For
        {' '}
        {role.title}
      </option>
    ));
  }

  renderWithRoleOptions() {
    const query = new URLSearchParams(this.props.location.search);
    const { script } = this.props.trip;
    const selfRoleName = query.get('for');
    if (!selfRoleName) {
      return [];
    }

    return script.content.roles
      .filter(role => role.name !== selfRoleName)
      .map(role => (
        <option key={role.name} value={role.name}>
          With
          {' '}
          {role.title}
        </option>
      ));
  }

  renderSend() {
    const { script } = this.props.trip;
    const query = new URLSearchParams(this.props.location.search);
    const hasRole = !!query.get('for');
    const hasWithRole = !!query.get('with');
    const withRoleName = query.get('with');
    const withRole = _.find(script.content.roles, { name: withRoleName });
    const sendPlaceholder = this.renderSendPlaceholder();
    const sendLabel = hasWithRole ? `Send to ${withRole.title}` : 'Send';
    const isSendDisabled = !hasRole || !hasWithRole
      || !this.state.pendingMessage;
    const forRoleOptions = this.renderForRoleOptions();
    const withRoleOptions = this.renderWithRoleOptions();
    return (
      <form className="row" onSubmit={this.handleSendPendingMessage}>
        <div className="col-sm-2">
          <select
            className="form-control"
            value={query.get('for') || ''}
            onChange={this.handleRoleChange}>
            <option value="">For all</option>
            {forRoleOptions}
          </select>
        </div>
        <div className="col-sm-2">
          <select
            className="form-control"
            value={query.get('with') || ''}
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
  location: PropTypes.object.isRequired,
  history: PropTypes.object.isRequired
};
