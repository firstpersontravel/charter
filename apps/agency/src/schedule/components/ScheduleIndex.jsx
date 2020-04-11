const PropTypes = require('prop-types');
const React = require('react');
const { Redirect } = require('react-router-dom');

const { isGroupInMonth } = require('../connectors/utils');

const curYear = new Date().getFullYear().toString();
const curMonth = (new Date().getMonth() + 1).toString().padStart(2, '0');

export default function ScheduleIndex({ match, groups }) {
  const groupsInMonth = groups
    .filter(group => isGroupInMonth(group, curYear, curMonth));
  if (groupsInMonth.length > 0) {
    return (
      <Redirect to={`/${match.params.orgName}/${match.params.experienceName}/schedule/${curYear}/${curMonth}/${groupsInMonth[0].id}`} />
    );
  }
  return (
    <Redirect to={`/${match.params.orgName}/${match.params.experienceName}/schedule/${curYear}/${curMonth}`} />
  );
}

ScheduleIndex.propTypes = {
  match: PropTypes.object.isRequired,
  groups: PropTypes.array.isRequired
};
