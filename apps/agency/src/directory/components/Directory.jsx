import _ from 'lodash';
import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router';

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
        &rsaquo; <Link
          activeClassName="bold"
          to={{
            pathname: `/${experience.org.name}/${experience.name}/directory`,
            query: { role: roleName }
          }}>
          {role.title}
        </Link>
         &nbsp;({roleProfiles.length})
      </div>
    );
  }

  renderRoles() {
    const profiles = this.props.profiles;
    const roleNames = _.uniq(_.map(profiles, 'roleName')).sort();
    const renderedRoles = _.filter(roleNames).map((roleName) => {
      const roleProfiles = _.filter(profiles, {
        roleName: roleName
      });
      return this.renderRole(roleName, roleProfiles);
    });

    return renderedRoles;
  }

  renderRolesSidebar() {
    const experience = this.props.experience;
    const roleQuery = this.props.location.query.role;
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
          <Link
            activeClassName="bold"
            to={`/${experience.org.name}/${experience.name}/directory?role=Archived`}>
            Archived
          </Link>
        </div>
      </div>
    );
  }

  render() {
    if (this.props.profiles.isLoading) {
      return (
        <div className="container-fluid">Loading</div>
      );
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
