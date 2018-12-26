import _ from 'lodash';
import React, { Component } from 'react';
import PropTypes from 'prop-types';

import { TextCore } from 'fptcore';

import PopoverControl from '../../../controls/popover-control';

export default class TripValues extends Component {

  constructor(props) {
    super(props);
    this.handleFlagUpdate = this.handleFlagUpdate.bind(this);
    this.handleValueUpdate = this.handleValueUpdate.bind(this);
    this.handleWaypointUpdate = this.handleWaypointUpdate.bind(this);
  }

  handleValueUpdate(key, newValue) {
    this.props.updateInstance('trips', this.props.params.tripId, {
      values: { [key]: newValue }
    });
    this.props.postAdminAction(this.props.params.tripId, 'notify',
      { notify_type: 'refresh' }, false);
  }

  handleFlagUpdate(key, newValue) {
    this.handleValueUpdate(key, newValue === 'Yes');
  }

  handleWaypointUpdate(key, event) {
    this.props.updateInstance('trips', this.props.params.tripId, {
      values: {
        waypoint_options: {
          $auto: {
            $merge: {
              [key]: event.target.value
            }
          }
        }
      }
    });
    this.props.postAdminAction(this.props.params.tripId, 'notify',
      { notify_type: 'refresh' }, false);
  }

  renderFlagRow(value) {
    const title = TextCore.titleForKey(value.key.substring(5));
    const label = value.value ? 'Yes' : 'No';
    const labelClass = value.value ? '' : 'faint';
    return (
      <tr key={value.key}>
        <td>{title}</td>
        <td>
          <PopoverControl
            title={title}
            choices={['Yes', 'No']}
            onConfirm={_.curry(this.handleFlagUpdate)(value.key)}
            value={label}
            labelClassName={labelClass} />
        </td>
      </tr>
    );
  }

  renderTextValue(value) {
    const title = TextCore.titleForKey(value.key);
    const isText = _.includes(['string', 'number'], typeof value.value);
    if (!isText) {
      return JSON.stringify(value.value, null, 2);
    }
    return (
      <PopoverControl
        title={title}
        onConfirm={_.curry(this.handleValueUpdate)(value.key)}
        value={value.value} />
    );
  }

  renderValueRow(value) {
    const title = TextCore.titleForKey(value.key);
    const valueComponent = this.renderTextValue(value);
    return (
      <tr key={value.key}>
        <td>{title}</td>
        <td>
          {valueComponent}
        </td>
      </tr>
    );
  }

  renderWaypointRow(waypoint) {
    const currentValue = _.get(
      this.props.tripStatus.instance.values,
      `waypoint_options.${waypoint.name}`) || waypoint.options[0].name;
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
          value={currentValue}
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
    const values = _(trip.values)
      .map((v, k) => ({ key: k, value: v }))
      .filter(({ key, value }) => key !== 'waypoint_options')
      .value();
    const flags = _.filter(values, i => i.key.substring(0, 5) === 'flag_');
    const nonflags = _.filter(values, i => i.key.substring(0, 5) !== 'flag_');
    const flagRows = flags.map(flag => this.renderFlagRow(flag));
    const nonflagRows = nonflags.map(value => this.renderValueRow(value));
    const waypointRows = this.renderWaypointRows();
    return (
      <div className="row">
        <div className="col-sm-8">
          <h3>Values</h3>
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
