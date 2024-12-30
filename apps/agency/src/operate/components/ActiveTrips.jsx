import _ from 'lodash';
import Faye from 'faye';
import React, { Component } from 'react';
import moment from 'moment-timezone';
import PropTypes from 'prop-types';

import Loader from '../../partials/Loader';
import config from '../../config';

// Throttle message based updates to once every 5 secs.
const THROTTLE_FREQUENCY = 5000;

// Auto refresh every 60 secs
const REFRESH_FREQUENCY = 60000;

const FayeLogger = {
  incoming: function (message, callback) {
    // console.log('incoming', message);
    callback(message);
  },
  outgoing: function (message, callback) {
    // console.log('outgoing', message);
    callback(message);
  }
};

export default class Group extends Component {
  constructor(props) {
    super(props);
    this.fayeClient = new Faye.Client(`${config.serverUrl}/pubsub`);
    this.fayeClient.addExtension(FayeLogger);
    this.fayeSubscriptions = {};
    this.refreshInterval = null;
    this.throttleInterval = null;
    this.refreshTimeout = null;
    this.refreshedForActionIds = {};
    this.nextActionAt = null;
    this.handleRefresh = this.handleRefresh.bind(this);
    this.autoRefresh = this.autoRefresh.bind(this);
    this.autoThrottle = this.autoThrottle.bind(this);
    this.state = { throttledTripIds: new Set() };
  }

  componentWillMount() {
    // no need to load on mount because the app on load refreshes live
    // data for all active groups
    const tripIds = _.map(this.props.trips, 'id');
    this.loadData(this.props.org, this.props.experience, this.props.script, tripIds);
    this.refreshInterval = setInterval(this.autoRefresh, REFRESH_FREQUENCY);
    this.throttleInterval = setInterval(this.autoThrottle, THROTTLE_FREQUENCY);
    this.checkNextUnappliedAction(this.props.nextUnappliedAction);
  }

  componentWillReceiveProps(nextProps) {
    const curTripIds = _.map(this.props.trips, 'id');
    const nextTripIds = _.map(nextProps.trips, 'id');
    if (!_.isEqual(curTripIds.sort(), nextTripIds.sort())) {
      this.loadData(nextProps.org, nextProps.experience, nextProps.script, nextTripIds);
    }
    this.checkNextUnappliedAction(nextProps.nextUnappliedAction);
  }

  componentWillUnmount() {
    clearInterval(this.refreshInterval);
    clearInterval(this.throttleInterval);
    if (this.refreshTimeout) {
      clearTimeout(this.refreshTimeout);
    }
  }

  checkNextUnappliedAction(nextUnappliedAction) {
    // If no upcoming action, no action neededd
    if (!nextUnappliedAction) {
      return;
    }
    // If we already refreshed for this action, no need to try again
    if (this.refreshedForActionIds[nextUnappliedAction.id]) {
      return;
    }
    const scheduledAt = moment.utc(nextUnappliedAction.scheduledAt);
    // Clear already scheduled timeout if this coems earlier.
    if (this.refreshTimeout) {
      // If the next action is the same or after the scheduled
      // action, then don't do anything -- the auto refresh
      // will take care of updating nextAction to the next one
      if (scheduledAt.isSameOrAfter(this.nextActionAt)) {
        return;
      }
      // If the next action is before, we have to clear the old
      // refresh timeout and replace it with this sooner one.
      console.log(
        `resetting for new action ${nextUnappliedAction.id}`
      );
      clearTimeout(this.refreshTimeout);
      this.refreshTimeout = null;
      this.nextActionAt = null;
    }
    const timezone = this.props.experience.timezone;
    console.log(
      `next action ${nextUnappliedAction.id} ${scheduledAt.fromNow()} ` +
      `(${scheduledAt.clone().tz(timezone).format('h:mm:ssa z')})`
    );
    const msecFromNow = Math.max(0, scheduledAt.diff(moment.utc(), 'ms'));
    this.refreshedForActionIds[nextUnappliedAction.id] = true;
    this.nextActionAt = scheduledAt;
    this.refreshTimeout = setTimeout(() => {
      console.log(
        `refreshing on schedule for action ${nextUnappliedAction.id}`
      );
      this.refreshTimeout = null;
      this.autoRefresh();
    }, msecFromNow + 2000);
  }

  handleRefresh() {
    const tripIds = _.map(this.props.trips, 'id');
    this.loadData(this.props.org, this.props.experience, this.props.script, tripIds);
  }

  autoRefresh() {
    this.handleRefresh();
  }

  autoThrottle() {
    // If we've throttled messages for trips, load them now, then clear
    if (this.state.throttledTripIds.size > 0) {
      this.props.refreshLiveData(this.props.org.id, this.props.experience.id,
        [...this.state.throttledTripIds]);
      this.setState({ throttledTripIds: new Set() });
    }
  }

  loadData(org, experience, script, tripIds) {
    if (experience.isNull || experience.isLoading) {
      // Await loading
      return;
    }
    if (!tripIds || !tripIds.length) {
      this.props.listCollection('trips', {
        orgId: org.id,
        experienceId: experience.id,
        isArchived: false
      });
      return;
    }
    this.updateFayeSubscriptions(tripIds);
    this.props.refreshLiveData(org.id, experience.id, tripIds);
    this.props.listCollection('assets', {
      orgId: org.id,
      experienceId: experience.id,
      type: 'directions'
    });
  }

  updateFayeSubscriptions(tripIds) {
    // Cancel unneeded subscriptions
    const newIds = tripIds.map(id => id.toString());
    const subscribedIds = Object.keys(this.fayeSubscriptions);
    _.difference(subscribedIds, newIds).forEach((tripId) => {
      console.log(`Cancelling subscription to ${tripId}`);
      this.fayeSubscriptions[tripId].cancel();
    });

    // Subscribe to new channels
    newIds.forEach((tripId) => {
      // If already subscribed, then don't do anything
      if (this.fayeSubscriptions[tripId]) {
        return;
      }
      // Otherwise, subscribe
      const channel = `/trip_${tripId}`;
      console.log(`Subscribing to ${channel}`);
      const subscription = this.fayeClient.subscribe(channel, (message) => {
        this.handleFayeMessage(tripId, message);
      });
      this.fayeSubscriptions[tripId] = subscription;
    });
  }

  handleFayeMessage(tripId, message) {
    console.log('Got faye message', tripId, message);
    // TODO: use this data to update just the location
    if (message.medium === 'device_state') {
      return;
    }

    // If we have refreshed on msg more recently than 10 secs, skip -- it'll be covered
    // by the auto-refresh.
    if (Date.now() - (this.lastRefreshMsec || 0) < THROTTLE_FREQUENCY) {
      if (!this.state.throttledTripIds.has(tripId)) {
        this.setState({
          throttledTripIds: new Set(tripId, ...this.state.throttledTripIds)
        });
      }
      return;
    }

    console.log('Refreshing due to incoming realtime event.');
    this.lastRefreshMsec = Date.now();
    this.props.refreshLiveData(
      this.props.org.id,
      this.props.experience.id,
      [tripId]
    );
  }

  renderRefresh() {
    if (this.props.areRequestsPending) {
      return (<span><i className="fa fa-spin fa-sync" /> Refreshing</span>);
    }
    if (this.state.throttledTripIds.size > 0) {
      return (<span><i className="fa fa-clock" /> Pending</span>);
    }
    return (
      <span><i className="fa fa-sync" /> Refresh</span>
    );
  }

  render() {
    if (this.props.experience.isNull || this.props.experience.isLoading) {
      return <Loader />;
    }
    if (this.props.script.isNull || this.props.script.isLoading) {
      return <Loader />;
    }
    if (this.props.trips.length === 0) {
      return <div className="container-fluid">No trips</div>;
    }

    return (
      <div className="container-fluid" style={{ position: 'relative' }}>
        <div className="fixed-corner d-none d-sm-block">
          <button
            className="btn btn-outline-secondary btn-sm"
            onClick={this.handleRefresh}>
            {this.renderRefresh()}
          </button>
        </div>
        {this.props.children}
      </div>
    );
  }
}

Group.propTypes = {
  areRequestsPending: PropTypes.bool.isRequired,
  children: PropTypes.node.isRequired,
  org: PropTypes.object.isRequired,
  experience: PropTypes.object.isRequired,
  trips: PropTypes.array.isRequired,
  script: PropTypes.object.isRequired,
  nextUnappliedAction: PropTypes.object,
  listCollection: PropTypes.func.isRequired,
  refreshLiveData: PropTypes.func.isRequired
};

Group.defaultProps = {
  nextUnappliedAction: null
};
