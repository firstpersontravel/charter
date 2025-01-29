import React, { Component } from 'react';
import PropTypes from 'prop-types';
import Faye from 'faye';

export default class EventSub extends Component {
  constructor(props) {
    super(props);
    this.client = new Faye.Client('/pubsub');
    this.subscription = null;
    this.onReceiveMessage = this.onReceiveMessage.bind(this);
  }

  componentDidMount() {
    this.subscription = this.client.subscribe(`/trip_${this.props.tripId}`, this.onReceiveMessage);
  }
  componentWillUnmount() {
    this.subscription.cancel();
    this.subscription = null;
  }

  onReceiveMessage(msg) {
    this.props.receiveMessage(this.props.tripId, msg);
  }

  render() {
    return null;
  }
}

EventSub.propTypes = {
  tripId: PropTypes.number.isRequired,
  receiveMessage: PropTypes.func.isRequired
};
