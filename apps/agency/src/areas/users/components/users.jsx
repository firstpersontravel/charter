import _ from 'lodash';
import React from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router';

function renderRole(script, role, profiles) {
  const num = _.filter(profiles, profile => (
    !profile.isArchived &&
    profile.scriptName === script.name &&
    profile.roleName === role.name
  )).length;

  return (
    <div key={role.name} className="constrain-text">
      &rsaquo; <Link
        activeClassName="bold"
        to={{
          pathname: '/agency/users',
          query: { script: script.name, role: role.name }
        }}>
        {role.name}
      </Link>
       &nbsp;({num})
    </div>
  );
}

function renderScriptRoles(roleQuery, script, profiles) {
  const roles = script.content.roles || [];
  const roleCells = _.filter(roles, { user: true })
    .map(role => renderRole(script, role, profiles));
  return (
    <div key={script.name} style={{ marginTop: '0.5em' }}>
      <div>
        <strong>
          <Link to={`/agency/users?script=${script.name}`}>
            {script.title}
          </Link>
        </strong>
      </div>
      {roleCells}
    </div>
  );
}

function renderRolesCol(roleQuery, scripts, profiles) {
  const scriptCells = scripts
    .map(script => renderScriptRoles(roleQuery, script, profiles));
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

export default function Users({ children, location, scripts, profiles }) {
  const roleQuery = location.query.role;
  const rolesCol = renderRolesCol(roleQuery, scripts, profiles);
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
  scripts: PropTypes.array,
  profiles: PropTypes.array
};
