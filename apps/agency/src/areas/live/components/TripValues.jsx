import _ from 'lodash';
import React, { Component } from 'react';
import PropTypes from 'prop-types';

import { TextCore } from 'fptcore';

import PopoverControl from '../../../controls/popover-control';

export default class TripValues extends Component {

  constructor(props) {
    super(props);
    this.handleFlagUpdate = this.handleFlagUpdate.bind(this);
    this.handleCustomizationUpdate = this.handleCustomizationUpdate.bind(this);
    this.handleWaypointUpdate = this.handleWaypointUpdate.bind(this);
  }

  handleCustomizationUpdate(key, newValue) {
    this.props.updateInstance('trips', this.props.params.tripId, {
      customizations: { [key]: newValue }
    });
    this.props.postAdminAction(this.props.params.tripId, 'notify',
      { notify_type: 'refresh' }, false);
  }

  handleFlagUpdate(key, newValue) {
    this.handleCustomizationUpdate(key, newValue === 'Yes');
  }

  handleWaypointUpdate(key, event) {
    this.props.updateInstance('trips', this.props.params.tripId, {
      waypointOptions: { [key]: event.target.value }
    });
    this.props.postAdminAction(this.props.params.tripId, 'notify',
      { notify_type: 'refresh' }, false);
  }

  renderFlagRow(item) {
    const title = TextCore.titleForKey(item.key.substring(5));
    const label = item.value ? 'Yes' : 'No';
    const labelClass = item.value ? '' : 'faint';
    return (
      <tr key={item.key}>
        <td>{title}</td>
        <td>
          <PopoverControl
            title={title}
            choices={['Yes', 'No']}
            onConfirm={_.curry(this.handleFlagUpdate)(item.key)}
            value={label}
            labelClassName={labelClass} />
        </td>
      </tr>
    );
  }

  renderTextCustomization(item) {
    const title = TextCore.titleForKey(item.key);
    const isText = _.includes(['string', 'number'], typeof item.value);
    if (!isText) {
      return JSON.stringify(item.value, null, 2);
    }
    return (
      <PopoverControl
        title={title}
        onConfirm={_.curry(this.handleCustomizationUpdate)(item.key)}
        value={item.value} />
    );
  }

  renderCustomizationRow(item) {
    const title = TextCore.titleForKey(item.key);
    const itemComponent = this.renderTextCustomization(item);
    return (
      <tr key={item.key}>
        <td>{title}</td>
        <td>{itemComponent}</td>
      </tr>
    );
  }

  renderWaypointRow(waypoint) {
    const waypointOptions = this.props.tripStatus.instance.waypointOptions;
    const currentValue = _.get(waypointOptions, waypoint.name);
    const currentOrDefault = currentValue || waypoint.options[0].name;
    const options = waypoint.options.map(option => (
      <option key={option.name} value={option.name}>
        {option.title}
      </option>
    ));
    return (
      <div key={waypoint.name}>
        {waypoint.title}
        <br />
        <select
          className="form-control"
          value={currentOrDefault}
          onChange={_.curry(this.handleWaypointUpdate)(waypoint.name)}>
          {options}
        </select>
      </div>
    );
  }

  renderWaypointRows() {
    if (!this.props.tripStatus.instance.script) {
      return null;
    }
    return (this.props.tripStatus.instance.script.content.waypoints || [])
      .filter(w => w.options)
      .map(w => this.renderWaypointRow(w));
  }

  render() {
    if (this.props.tripStatus.isError) {
      return <div>Error</div>;
    }
    const trip = this.props.tripStatus.instance;
    if (!trip) {
      return <div>Loading</div>;
    }
    const customizations = _(trip.customizations)
      .map((v, k) => ({ key: k, value: v }))
      .value();
    const flags = _.filter(customizations,
      i => i.key.substring(0, 5) === 'flag_');
    const nonflags = _.filter(customizations,
      i => i.key.substring(0, 5) !== 'flag_');
    const flagRows = flags.map(flag => (
      this.renderFlagRow(flag)
    ));
    const nonflagRows = nonflags.map(value => (
      this.renderCustomizationRow(value)
    ));
    const waypointRows = this.renderWaypointRows();
    return (
      <div className="row">
        <div className="col-sm-8">
          <h3>Customizations</h3>
          <table className="table table-striped table-sm">
            <tbody>
              {nonflagRows}
            </tbody>
          </table>
        </div>
        <div className="col-sm-4">
          <h4>Flags</h4>
          <table className="table table-striped table-sm">
            <tbody>
              {flagRows}
            </tbody>
          </table>
          <h4>Waypoints</h4>
          <div>
            {waypointRows}
          </div>
        </div>
      </div>
    );
  }
}

TripValues.propTypes = {
  params: PropTypes.object.isRequired,
  tripStatus: PropTypes.object.isRequired,
  updateInstance: PropTypes.func.isRequired,
  postAdminAction: PropTypes.func.isRequired
};
