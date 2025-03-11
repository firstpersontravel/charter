import moment from 'moment';
import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { NavLink, Link } from 'react-router-dom';

import Alert from '../../partials/Alert';
import Loader from '../../partials/Loader';
import { withLoader } from '../../loader-utils';
import TripModal from '../partials/TripModal';

class Trip extends Component {
  constructor(props) {
    super(props);
    this.handleArchiveTrip = this.handleArchiveTrip.bind(this);
    this.handleEditTripClose = this.handleEditTripClose.bind(this);
    this.handleEditTrip = this.handleEditTrip.bind(this);
  }

  handleArchiveTrip(trip) {
    this.props.updateInstance('trips', trip.id, {
      isArchived: !trip.isArchived
    });
  }

  handleEditTripClose() {
    this.props.history.push({ search: '' });
  }

  handleEditTrip(script, fields) {
    const query = new URLSearchParams(this.props.location.search);
    const editingTripId = query.get('trip');
    this.props.updateInstance('trips', editingTripId, {
      title: fields.title,
      variantNames: fields.variantNames.join(','),
      tripState: { currentSceneName: '' }
    });
    this.handleEditTripClose();
  }

  renderTabs() {
    return (
      <ul className="nav nav-tabs">
        <li className="nav-item">
          <NavLink
            className="nav-link"
            activeClassName="active"
            to={
              `/${this.props.org.name}/${this.props.experience.name}`
              + `/schedule/${this.props.match.params.year}/${this.props.match.params.month}`
              + `/${this.props.trip.id}`}>
            Users
          </NavLink>
        </li>
      </ul>
    );
  }

  renderTripsDetail() {
    return (
      <div>
        {this.renderTabs()}
        {this.props.children}
      </div>
    );
  }

  render() {
    const { trip } = this.props;
    if (!trip.isLoading && (trip.isError || trip.isNull)) {
      return <Alert color="danger" content="Error loading trip." />;
    }
    if ((!trip && trip.isLoading)
        || !trip.script
        || trip.script.isNull) {
      return <Loader />;
    }

    const query = new URLSearchParams(this.props.location.search);
    const editingTripId = query.get('trip');
    const isEditingTrip = !!editingTripId;
    const editingTrip = (isEditingTrip && editingTripId !== 'new')
      ? trip : null;

    const dateShort = moment(trip.date).format('MMM D');

    const editTripBtn = (
      <Link
        className="btn btn-sm btn-outline-secondary"
        to={{ search: `?trip=${trip.id}` }}>
        Edit
      </Link>
    );
    const archiveTripBtn = (
      <button
        className="btn btn-sm btn-outline-secondary ml-1"
        onClick={() => this.handleArchiveTrip(trip)}>
        {trip.isArchived ? 'Unarchive' : 'Archive'}
      </button>
    );

    const archivedStyle = { textDecoration: 'line-through' };
    return (
      <div>
        <div className="mb-3">
          <div className="float-right text-right">
            {editTripBtn}
            {archiveTripBtn}
          </div>
          <h4 style={trip.isArchived ? archivedStyle : null}>
            {dateShort}
            :
            {trip.title}
          </h4>
        </div>

        {this.renderTripsDetail()}
        <TripModal
          isOpen={isEditingTrip}
          script={this.props.script}
          trip={editingTrip}
          onClose={this.handleEditTripClose}
          onConfirm={this.handleEditTrip} />
      </div>
    );
  }
}

Trip.propTypes = {
  org: PropTypes.object.isRequired,
  experience: PropTypes.object.isRequired,
  script: PropTypes.object.isRequired,
  trip: PropTypes.object.isRequired,
  updateInstance: PropTypes.func.isRequired,
  children: PropTypes.node.isRequired,
  match: PropTypes.object.isRequired,
  history: PropTypes.object.isRequired,
  location: PropTypes.object.isRequired
};

const loadProps = ['match.params.tripId'];
export default withLoader(Trip, loadProps, (props) => {
  if (props.trip.id) {
    props.listCollection('players', {
      tripId: props.trip.id,
      orgId: props.experience.orgId
    });
    props.listCollection('scripts', {
      id: props.trip.scriptId,
      experienceId: props.experience.id,
      orgId: props.experience.orgId
    });
  }
  props.listCollection('trips', {
    id: props.match.params.tripId,
    experienceId: props.experience.id,
    orgId: props.experience.orgId
  });
});
