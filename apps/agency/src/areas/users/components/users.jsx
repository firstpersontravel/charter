import _ from 'lodash';
import React from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router';

function renderRole(experience, roleName, roleProfiles) {
  if (!roleProfiles.length) {
    return null;
  }
  return (
    <div key={roleName} className="constrain-text">
      &rsaquo; <Link
        activeClassName="bold"
        to={{
          pathname: '/agency/users',
          query: { experience: experience.name, role: roleName }
        }}>
        {roleName}
      </Link>
       &nbsp;({roleProfiles.length})
    </div>
  );
}

function renderExperienceRoles(roleQuery, experience, profiles) {
  const experienceProfiles = _.filter(profiles, {
    scriptName: experience.name
  });
  const roleNames = _.uniq(_.map(profiles, 'roleName')).sort();
  const renderedRoles = _.filter(roleNames)
    .map(roleName => renderRole(experience, roleName,
      _.filter(experienceProfiles, { roleName: roleName })));
  return (
    <div key={experience.id} style={{ marginTop: '0.5em' }}>
      <div>
        <strong>
          <Link to={`/agency/users?experience=${experience.name}`}>
            {experience.title}
          </Link>
        </strong>
      </div>
      {renderedRoles}
    </div>
  );
}

function renderRolesCol(roleQuery, experiences, profiles) {
  const scriptCells = experiences
    .map(experience => renderExperienceRoles(roleQuery, experience, profiles));
  return (
    <div className="col-sm-3 d-none d-sm-block">
      <h3>Roles</h3>
      <div>
        <Link className={roleQuery ? '' : 'bold'} to="/agency/users">
          All
        </Link>
      </div>
      {scriptCells}
      <div style={{ marginTop: '0.5em' }}>
        <Link activeClassName="bold" to="/agency/users?role=Archived">
          Archived
        </Link>
      </div>
    </div>
  );
}

export default function Users({ children, location, experiences, profiles }) {
  const roleQuery = location.query.role;
  const rolesCol = renderRolesCol(roleQuery, experiences, profiles);
  return (
    <div className="container-fluid">
      <div className="row">
        {rolesCol}
        {children}
      </div>
    </div>
  );
}

Users.propTypes = {
  children: PropTypes.node,
  location: PropTypes.object,
  experiences: PropTypes.array,
  profiles: PropTypes.array
};
