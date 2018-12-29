import _ from 'lodash';
import moment from 'moment-timezone';
import React, { Component } from 'react';
import PropTypes from 'prop-types';

import { TimeUtil, TextUtil } from 'fptcore';

import PopoverControl from '../../../controls/popover-control';

export default class TripSchedule extends Component {

  constructor(props) {
    super(props);
    this.handleTimeUpdate = this.handleTimeUpdate.bind(this);
  }

  handleTimeUpdate(timeName, oldTimestamp, newTimeShorthand) {
    const trip = this.props.trip;
    const timezone = trip.experience.timezone;
    const oldDate = moment.utc(oldTimestamp).tz(timezone).format('YYYY-MM-DD');
    const newTimestamp = TimeUtil.convertTimeShorthandToIso(
      newTimeShorthand, oldDate, timezone);
    this.props.updateInstance('trips', trip.id, {
      schedule: { [timeName]: newTimestamp }
    });
    this.props.postAdminAction(trip.id, 'notify', { notify_type: 'refresh' });
  }

  renderTimeRow(timeName, timestamp, timezone) {
    const localTime = moment.utc(timestamp).tz(timezone);
    const dayString = localTime.format('ddd');
    const timeString = localTime.format('h:mma');
    const timeLabel = TextUtil.titleForKey(timeName.substring(5));
    return (
      <tr key={timeName}>
        <td>{timeLabel}</td>
        <td>
          {dayString}
          {' '}
          <PopoverControl
            title={timeName}
            onConfirm={_.curry(this.handleTimeUpdate)(
              timeName, timestamp)}
            value={timeString}
            validate={TimeUtil.validateTimeShorthand}
            label={timeString} />
        </td>
      </tr>
    );
  }

  render() {
    const timezone = this.props.trip.experience.timezone;
    const timeRows = _.map(this.props.trip.schedule, (timestamp, timeName) => (
      this.renderTimeRow(timeName, timestamp, timezone)
    ));
    return (
      <div>
        <h3>Schedule</h3>
        <table className="table table-striped table-sm">
          <tbody>
            {timeRows}
          </tbody>
        </table>
      </div>
    );
  }
}

TripSchedule.propTypes = {
  trip: PropTypes.object.isRequired,
  postAdminAction: PropTypes.func.isRequired,
  updateInstance: PropTypes.func.isRequired
};
