import _ from 'lodash';
import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { NavLink, Link } from 'react-router-dom';

import { RoleCore } from 'fptcore';

import Loader from '../../partials/Loader';

export default class Directory extends Component {
  renderRole(roleName, roleProfiles) {
    if (!roleProfiles.length) {
      return null;
    }
    const role = roleProfiles[0].role;
    if (!role) {
      return null;
    }
    const experience = this.props.experience;
    return (
      <div key={roleName} className="constrain-text">
        &rsaquo; <NavLink
          activeClassName="bold"
          to={{
            pathname: `/${experience.org.name}/${experience.name}/directory`,
            query: { role: roleName }
          }}>
          {role.title}
        </NavLink>
         &nbsp;({roleProfiles.length})
      </div>
    );
  }

  renderRoles() {
    const script = this.props.experience.script;
    const profiles = this.props.profiles;
    const roleNames = _(script.content.roles)
      .filter(RoleCore.canRoleHaveUser)
      .map('name')
      .value();
    return roleNames.map((roleName) => {
      const roleProfiles = _.filter(profiles, { roleName: roleName });
      return this.renderRole(roleName, roleProfiles);
    });
  }

  renderRolesSidebar() {
    const experience = this.props.experience;
    const query = new URLSearchParams(this.props.location.search);
    const roleQuery = query.get('role');
    return (
      <div className="col-sm-3 d-none d-sm-block">
        <h3>Roles</h3>
        <div>
          <Link
            className={roleQuery ? '' : 'bold'}
            to={`/${experience.org.name}/${experience.name}/directory`}>
            All
          </Link>
        </div>
        {this.renderRoles()}
        <div className="mt-2">
          <NavLink
            activeClassName="bold"
            to={`/${experience.org.name}/${experience.name}/directory?role=Archived`}>
            Archived
          </NavLink>
        </div>
      </div>
    );
  }

  render() {
    if (this.props.profiles.isLoading ||
      !this.props.experience.script) {
      return <Loader />;
    }
    return (
      <div className="container-fluid">
        <div className="row">
          {this.renderRolesSidebar()}
          {this.props.children}
        </div>
      </div>
    );
  }
}

Directory.propTypes = {
  children: PropTypes.node.isRequired,
  location: PropTypes.object.isRequired,
  experience: PropTypes.object.isRequired,
  profiles: PropTypes.array.isRequired
};
