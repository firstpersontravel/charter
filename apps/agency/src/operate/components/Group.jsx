import _ from 'lodash';
import Faye from 'faye';
import React, { Component } from 'react';
import moment from 'moment-timezone';
import PropTypes from 'prop-types';

import Loader from '../../partials/Loader';
import config from '../../config';
import { getStage } from '../../utils';

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
    this.fayeClient = new Faye.Client(`${config.pubsubUrl}/pubsub`);
    this.fayeClient.addExtension(FayeLogger);
    this.fayeSubscriptions = {};
    this.refreshInterval = null;
    this.refreshTimeout = null;
    this.refreshedForActionIds = {};
    this.nextActionAt = null;
    this.handleRefresh = this.handleRefresh.bind(this);
    this.autoRefresh = this.autoRefresh.bind(this);
  }

  componentWillMount() {
    // no need to load on mount because the app on load refreshes live
    // data for all active groups
    const group = this.props.group;
    const tripIds = _.map(group.trips, 'id');
    this.loadData(this.props.org, group, tripIds);
    this.refreshInterval = setInterval(this.autoRefresh, REFRESH_FREQUENCY);
    this.checkNextUnappliedAction(this.props.nextUnappliedAction);
  }

  componentWillReceiveProps(nextProps) {
    const curTripIds = _.map(this.props.group.trips, 'id');
    const nextTripIds = _.map(nextProps.group.trips, 'id');
    if (!_.isEqual(curTripIds.sort(), nextTripIds.sort()) ||
        this.props.group.id !== nextProps.group.id) {
      this.loadData(nextProps.org, nextProps.group, nextTripIds);
    }
    this.checkNextUnappliedAction(nextProps.nextUnappliedAction);
  }

  componentWillUnmount() {
    clearInterval(this.refreshInterval);
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
    const timezone = this.props.group.experience.timezone;
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
    const tripIds = _.map(this.props.group.trips, 'id');
    this.loadData(this.props.org, this.props.group, tripIds);
  }

  autoRefresh() {
    this.handleRefresh();
  }

  loadData(org, group, tripIds) {
    if (group.isNull) {
      return;
    }
    if (!tripIds || !tripIds.length) {
      // If we have no trip ids, it's probably because this group was
      // archived, so the trips are not loaded by default. We still want to
      // be able to view it though, so do an initial load. This triggers a prop
      // refresh, and now that all the trip ids are present, a normal
      // refreshLiveData will do the trick.`
      const groupId = this.props.match.params.groupId;
      this.props.retrieveInstance('groups', groupId);
      this.props.listCollection('trips', {
        orgId: org.id,
        experienceId: group.experienceId,
        groupId: groupId
      });
      return;
    }
    this.updateFayeSubscriptions(tripIds);
    this.props.refreshLiveData(org.id, group.experienceId, tripIds);
    this.props.retrieveInstance('scripts', group.scriptId);
    this.props.listCollection('assets', {
      orgId: org.id,
      experienceId: group.experienceId,
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
      console.log(`Subscribing to ${tripId}`);
      const channel = `/${getStage()}_trip_${tripId}`;
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
    // Reload in a second
    setTimeout(() => {
      console.log('Reloading due to incoming realtime event.');
      this.props.refreshLiveData(
        this.props.org.id,
        this.props.group.experienceId,
        [tripId]
      );
    }, 1000);
  }

  render() {
    const group = this.props.group;
    if (group.isError) {
      return <div className="container-fluid">Error - please reload</div>;
    }
    if (group.isLoading || (group.script && group.script.isLoading)) {
      return <Loader />;
    }
    if (group.isNull) {
      return <div className="container-fluid">Group not found</div>;
    }
    if (group.script.isNull) {
      return <Loader />;
    }
    if (group.trips.length === 0) {
      return <div className="container-fluid">No trips</div>;
    }
    const refreshTitle = this.props.areRequestsPending ?
      (<span><i className="fa fa-spin fa-refresh" /> Refreshing</span>) :
      (<span><i className="fa fa-refresh" /> Refresh</span>);

    return (
      <div className="container-fluid" style={{ position: 'relative' }}>
        <div className="fixed-corner d-none d-sm-block">
          <button
            className="btn btn-outline-secondary btn-sm"
            onClick={this.handleRefresh}>
            {refreshTitle}
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
  match: PropTypes.object.isRequired,
  group: PropTypes.object.isRequired,
  org: PropTypes.object.isRequired,
  nextUnappliedAction: PropTypes.object,
  retrieveInstance: PropTypes.func.isRequired,
  listCollection: PropTypes.func.isRequired,
  refreshLiveData: PropTypes.func.isRequired
};

Group.defaultProps = {
  nextUnappliedAction: null
};
