import _ from 'lodash';
import React, { Component } from 'react';
import PropTypes from 'prop-types';

const FptCore = require('fptcore').default;

import PopoverControl from '../../partials/PopoverControl';

export default class TripValues extends Component {
  constructor(props) {
    super(props);
    this.handleFlagUpdate = this.handleFlagUpdate.bind(this);
    this.handleValueUpdate = this.handleValueUpdate.bind(this);
    this.handleCustomizationUpdate = this.handleCustomizationUpdate.bind(this);
    this.handleWaypointUpdate = this.handleWaypointUpdate.bind(this);
  }

  handleCustomizationUpdate(key, newValue) {
    const { trip } = this.props;
    this.props.updateInstance('trips', this.props.trip.id, {
      customizations: { [key]: newValue }
    });
    this.props.postAdminAction(trip.orgId, trip.experienceId, trip.id,
      'notify', { notify_type: 'refresh' }, false);
  }

  handleValueUpdate(key, newValue) {
    const { trip } = this.props;
    this.props.updateInstance('trips', this.props.trip.id, {
      values: { [key]: newValue }
    });
    this.props.postAdminAction(trip.orgId, trip.experienceId, trip.id,
      'notify', { notify_type: 'refresh' }, false);
  }

  handleFlagUpdate(key, newValue) {
    this.handleCustomizationUpdate(key, newValue === 'Yes');
  }

  handleWaypointUpdate(key, event) {
    const { trip } = this.props;
    this.props.updateInstance('trips', this.props.trip.id, {
      waypointOptions: { [key]: event.target.value }
    });
    this.props.postAdminAction(trip.orgId, trip.experienceId, trip.id,
      'notify', { notify_type: 'refresh' }, false);
  }

  renderFlagRow(item) {
    const title = FptCore.TextUtil.titleForKey(item.key.substring(5));
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
    const title = FptCore.TextUtil.titleForKey(item.key);
    return (
      <PopoverControl
        title={title}
        onConfirm={_.curry(this.handleCustomizationUpdate)(item.key)}
        value={item.value} />
    );
  }

  renderCustomizationRow(item) {
    const title = FptCore.TextUtil.titleForKey(item.key);
    const itemComponent = this.renderTextCustomization(item);
    return (
      <tr key={item.key}>
        <td>{title}</td>
        <td>{itemComponent}</td>
      </tr>
    );
  }

  renderValue(key, value) {
    if (value === null || value === undefined) {
      return (<em className="faint">No value</em>);
    }
    // Boolean
    if (value === true || value === false) {
      return (
        <PopoverControl
          title={`Yes/no variable: ${key}`}
          choices={['Yes', 'No']}
          onConfirm={newValue => this.handleValueUpdate(key, newValue === 'Yes')}
          value={value ? 'Yes' : 'No'} />
      );
    }
    // Number
    if (typeof value === 'number') {
      return (
        <PopoverControl
          title={`Number variable: ${key}`}
          onConfirm={newValue => this.handleValueUpdate(key, Number(newValue))}
          value={value.toString()} />
      );
    }
    // String
    return (
      <PopoverControl
        title={`Text variable: ${key}`}
        onConfirm={newValue => this.handleValueUpdate(key, newValue)}
        value={value.toString()} />
    );
  }

  renderValueRow(key, value) {
    return (
      <tr key={key}>
        <td>{key}</td>
        <td>{this.renderValue(key, value)}</td>
      </tr>
    );
  }

  renderValues() {
    const keys = Object.keys(this.props.trip.values);
    if (!keys.length) {
      return (
        <em>
          No variables have been set yet. Values can be set with the &quot;Set Variable&quot;
          action, or defaults can be set in the &quot;Defaults&quot; area of the editor.
        </em>
      );
    }
    const valueRows = keys.map(k => this.renderValueRow(k, this.props.trip.values[k]));
    return (
      <table className="table table-striped table-sm">
        <tbody>
          {valueRows}
        </tbody>
      </table>
    );
  }

  renderWaypointRow(waypoint) {
    const { waypointOptions } = this.props.trip;
    const currentValue = _.get(waypointOptions, waypoint.name);
    const currentOrDefault = currentValue || waypoint.options[0].name;
    const options = waypoint.options.map(option => (
      <option key={option.name} value={option.name}>
        {option.location.title || option.location.address}
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
    const waysWithOpts = (this.props.trip.script.content.waypoints || [])
      .filter(w => w.options && w.options.length > 1);
    if (!waysWithOpts.length) {
      return (
        <em>
          No places have multiple locations.
          If you add multiple locations to a place in your script, you can choose one here.
        </em>
      );
    }
    return waysWithOpts.map(w => this.renderWaypointRow(w));
  }

  renderNonflags(nonflags) {
    const nonflagRows = nonflags.map(value => (
      this.renderCustomizationRow(value)
    ));
    if (!nonflagRows.length) {
      return (
        <em>
          Your project does not have any text customizations.
          These can be set in the defaults area of the editor and then customized for each run.
        </em>
      );
    }
    return (
      <table className="table table-striped table-sm">
        <tbody>
          {nonflagRows}
        </tbody>
      </table>
    );
  }

  renderFlags(flags) {
    const flagRows = flags.map(flag => this.renderFlagRow(flag));
    if (!flagRows.length) {
      return (
        <em>
          Yor project does not have any yes/no customizations.
          Thee can be set in the defaults area of the editor and then customized for each run.
        </em>
      );
    }
    return (
      <table className="table table-striped table-sm">
        <tbody>
          {flagRows}
        </tbody>
      </table>
    );
  }

  render() {
    const { trip } = this.props;
    const customizations = _(trip.customizations)
      .map((v, k) => ({ key: k, value: v }))
      .value();
    const flags = _.filter(customizations, i => i.value === true || i.value === false);
    const nonflags = _.filter(customizations, i => i.value !== true && i.value !== false);
    return (
      <div className="row">
        <div className="col-sm-8">
          <h3>Text customizations</h3>
          {this.renderNonflags(nonflags)}
          <h3>Variables</h3>
          {this.renderValues()}
        </div>
        <div className="col-sm-4">
          <h4>Yes/no customizations</h4>
          {this.renderFlags(flags)}
          <h4>Places</h4>
          {this.renderWaypointRows()}
        </div>
      </div>
    );
  }
}

TripValues.propTypes = {
  trip: PropTypes.object.isRequired,
  updateInstance: PropTypes.func.isRequired,
  postAdminAction: PropTypes.func.isRequired
};
