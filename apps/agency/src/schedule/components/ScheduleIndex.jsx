const PropTypes = require('prop-types');
const React = require('react');
const { Redirect } = require('react-router-dom');

const curYear = new Date().getFullYear().toString();
const curMonth = (new Date().getMonth() + 1).toString().padStart(2, '0');

export default function ScheduleIndex({ match, trips }) {
  if (trips.length > 0) {
    const [year, month] = trips[0].date.split('-', 2);
    return (
      <Redirect
        to={
          `/${match.params.orgName}/${match.params.experienceName}` +
          `/schedule/${year}/${month}/${trips[0].id}`
        } />
    );
  }
  return (
    <Redirect to={`/${match.params.orgName}/${match.params.experienceName}/schedule/${curYear}/${curMonth}`} />
  );
}

ScheduleIndex.propTypes = {
  match: PropTypes.object.isRequired,
  trips: PropTypes.array.isRequired
};
