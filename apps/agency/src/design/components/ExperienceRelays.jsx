import _ from 'lodash';
import React from 'react';
import PropTypes from 'prop-types';

import { TextUtil } from 'fptcore';

import Checkbox from '../partials/Checkbox';
import { getStage } from '../../utils';

function getCapabilities(relaySpec) {
  let smsInfo = '';
  if (relaySpec.sms_out && relaySpec.sms_in) {
    smsInfo = 'SMS Accept & Emit';
  } else if (relaySpec.sms_out) {
    smsInfo = 'SMS Emit Only';
  } else if (relaySpec.sms_in) {
    smsInfo = 'SMS Accept Only';
  }
  let phoneInfo = '';
  if (relaySpec.phone_out && relaySpec.phone_in) {
    phoneInfo = 'Phone Accept & Emit';
  } else if (relaySpec.phone_out) {
    phoneInfo = 'Phone Emit Only';
  } else if (relaySpec.phone_in) {
    phoneInfo = 'Phone Accept Only';
  }
  const adminInfo = relaySpec.admin_out ? 'Admin Emit' : null;
  const trailhead = relaySpec.trailhead ? 'Trailhead' : null;
  const capabilities = [smsInfo, phoneInfo, adminInfo, trailhead];
  return capabilities.filter(Boolean).join(', ');
}

export default class ExperienceRelays extends React.Component {

  constructor(props) {
    super(props);
    this.fetchedExperienceId = null;
    this.handleUpdateRelays = this.handleUpdateRelays.bind(this);
    this.handleToggleAllActive = this.handleToggleAllActive.bind(this);
    this.handleChangeRelayIsActive = this.handleChangeRelayIsActive.bind(this);
  }

  componentDidMount() {
    this.fetchRelays(this.props.experience);
  }

  componentWillReceiveProps(nextProps) {
    if (!nextProps.experience || !this.props.experience) {
      return;
    }
    if (nextProps.experience.id !== this.props.experience.id) {
      this.fetchRelays(nextProps.experience);
    }
  }

  fetchRelays(experience) {
    if (!experience) {
      return;
    }
    if (experience.id === this.fetchedExperienceId) {
      return;
    }
    this.fetchedExperienceId = experience.id;
    this.props.listCollection('relays', {
      stage: getStage(),
      orgId: experience.orgId,
      experienceId: experience.id
    });
  }

  handleUpdateRelays() {
    if (!this.props.experience) {
      return;
    }
    this.props.updateRelays(this.props.experience.id);
  }

  handleToggleAllActive() {
    const areAllActive = _.every(this.props.relays, 'isActive');
    const newIsActive = !areAllActive;
    this.props.relays
      .filter(relay => relay.isActive !== newIsActive)
      .forEach((relay) => {
        this.props.updateInstance('relays', relay.id, {
          isActive: newIsActive
        });
      });
  }

  handleChangeRelayIsActive(relayIds, e) {
    relayIds.forEach((relayId) => {
      this.props.updateInstance('relays', relayId, {
        isActive: e.target.checked
      });
    });
  }

  relaysForSpec(relaySpec) {
    return _.filter(this.props.relays, {
      experienceId: this.props.experience.id,
      forRoleName: relaySpec.for,
      withRoleName: relaySpec.with,
      asRoleName: relaySpec.as || relaySpec.for
    });
  }

  renderRelay(relaySpec, departureName) {
    const relays = _(this.props.relays)
      .filter({
        experienceId: this.props.experience.id,
        departureName: departureName,
        forRoleName: relaySpec.for,
        withRoleName: relaySpec.with,
        asRoleName: relaySpec.as || relaySpec.for
      })
      .sortBy('userPhoneNumber')
      .value();
    if (!relays.length) {
      return <td key={departureName}>–</td>;
    }
    const relaysRendered = relays.map(relay => (
      <div key={relay.id}>
        {TextUtil.formatPhone(relay.relayPhoneNumber)}
        &nbsp;for&nbsp;
        {relay.userPhoneNumber ?
          TextUtil.formatPhone(relay.userPhoneNumber) :
          'all'}
      </div>
    ));
    return (
      <td key={departureName}>
        {relaysRendered}
      </td>
    );
  }

  renderRelaySpec(relaySpec, departureNames) {
    const renderedRelays = departureNames.map(departureName => (
      this.renderRelay(relaySpec, departureName)
    ));
    const relays = this.relaysForSpec(relaySpec);
    const relayIds = _.map(relays, 'id');
    const areAllActive = _.every(relays, relay => relay.isActive);
    const areAllInactive = _.every(relays, relay => !relay.isActive);
    const isIndeterminate = !areAllActive && !areAllInactive;
    const capabilities = getCapabilities(relaySpec);
    const activeCheckbox = relays.length ? (
      <Checkbox
        checked={areAllActive}
        indeterminate={isIndeterminate}
        onChange={_.curry(this.handleChangeRelayIsActive)(relayIds)} />
    ) : null;
    return (
      <tr key={`${relaySpec.for}-${relaySpec.with}-${relaySpec.as}`}>
        <td>{relaySpec.for}</td>
        <td>{relaySpec.as}</td>
        <td>{relaySpec.with}</td>
        {renderedRelays}
        <td>{capabilities}</td>
        <td>{activeCheckbox}</td>
      </tr>
    );
  }

  renderTrailhead() {
    const relaySpecs = this.props.script.content.relays || [];
    const trailheadSpec = _.find(relaySpecs, { trailhead: true });
    if (!trailheadSpec) {
      return null;
    }
    const trailheads = this.relaysForSpec(trailheadSpec);
    if (!trailheads.length) {
      return null;
    }
    const trailheadDetails = trailheads.map(trailhead => (
      <span key={trailhead.id}>
        {trailhead.departureName}:&nbsp;
        {TextUtil.formatPhone(trailhead.relayPhoneNumber)}
        &nbsp;
      </span>
    ));
    return (
      <h1>
        {trailheadDetails}
      </h1>
    );
  }

  renderRelays() {
    const relaySpecs = this.props.script.content.relays || [];
    const departureNames = _.map(this.props.script.content.departures, 'name');

    const renderedSpecs = relaySpecs.map(relaySpec => (
      this.renderRelaySpec(relaySpec, departureNames)
    ));

    const departureheaders = departureNames.map(departureName => (
      <th key={departureName}>{departureName}</th>
    ));

    return (
      <table className="table table-striped table-sm">
        <thead>
          <tr>
            <th>For</th>
            <th>As</th>
            <th>With</th>
            {departureheaders}
            <th>Capabilities</th>
            <th>Active</th>
          </tr>
        </thead>
        <tbody>
          {renderedSpecs}
        </tbody>
      </table>
    );
  }

  renderActions() {
    const isDisabled = this.props.areAnyRequestsPending;
    const relaySpecs = this.props.script.content.relays || [];
    const areAllActive = _.every(this.props.relays, 'isActive');
    const numDepartures = this.props.script.content.departures.length;
    const hasRequiredRelays = _.every(relaySpecs.map(relaySpec => (
      this.relaysForSpec(relaySpec).length >= numDepartures
    )));
    const assignPhoneButton = hasRequiredRelays ? null : (
      <button
        disabled={isDisabled}
        className="btn btn-outline-primary"
        onClick={this.handleUpdateRelays}>
        Assign phone numbers
      </button>
    );
    const toggleActiveButton = (
      <button
        disabled={isDisabled}
        className="btn btn-outline-primary"
        onClick={this.handleToggleAllActive}>
        {areAllActive ? 'Deactivate all' : 'Activate all'}
      </button>
    );
    return (
      <div>
        {assignPhoneButton}
        &nbsp;
        {toggleActiveButton}
      </div>
    );
  }

  render() {
    if (!this.props.script || !this.props.experience) {
      return <div>Loading</div>;
    }
    return (
      <div className="row">
        <div className="col-sm-12">
          {this.renderTrailhead()}
          {this.renderRelays()}
        </div>
        <div className="col-sm-12">
          {this.renderActions()}
        </div>
      </div>
    );
  }
}

ExperienceRelays.propTypes = {
  areAnyRequestsPending: PropTypes.bool.isRequired,
  listCollection: PropTypes.func.isRequired,
  updateInstance: PropTypes.func.isRequired,
  updateRelays: PropTypes.func.isRequired,
  experience: PropTypes.object,
  script: PropTypes.object,
  relays: PropTypes.array.isRequired
};

ExperienceRelays.defaultProps = {
  script: null,
  experience: null
};
