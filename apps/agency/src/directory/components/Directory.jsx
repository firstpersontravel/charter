import _ from 'lodash';
import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router';

export default class Directory extends Component {

  renderRole(experience, roleName, roleProfiles) {
    if (!roleProfiles.length) {
      return null;
    }
    const organizationName = this.props.params.organizationName;
    return (
      <div key={roleName} className="constrain-text">
        &rsaquo; <Link
          activeClassName="bold"
          to={{
            pathname: `/${organizationName}/directory`,
            query: { experienceId: experience.id, role: roleName }
          }}>
          {roleName}
        </Link>
         &nbsp;({roleProfiles.length})
      </div>
    );
  }

  renderExperienceRoles(experience) {
    const organizationName = this.props.params.organizationName;
    const profiles = this.props.profiles;
    const experienceProfiles = _.filter(profiles, {
      experienceId: experience.id
    });
    const roleNames = _.uniq(_.map(profiles, 'roleName')).sort();
    const renderedRoles = _.filter(roleNames).map((roleName) => {
      const roleProfiles = _.filter(experienceProfiles, {
        roleName: roleName
      });
      return this.renderRole(experience, roleName, roleProfiles);
    });

    return (
      <div key={experience.id} style={{ marginTop: '0.5em' }}>
        <div>
          <strong>
            <Link to={`/${organizationName}/directory?experienceId=${experience.id}`}>
              {experience.title}
            </Link>
          </strong>
        </div>
        {renderedRoles}
      </div>
    );
  }

  renderRolesCol() {
    const organizationName = this.props.params.organizationName;
    const experiences = this.props.experiences;
    const roleQuery = this.props.location.query.role;
    const scriptCells = experiences.map(experience => (
      this.renderExperienceRoles(experience)
    ));
    return (
      <div className="col-sm-3 d-none d-sm-block">
        <h3>Roles</h3>
        <div>
          <Link
            className={roleQuery ? '' : 'bold'}
            to={`/${organizationName}/directory`}>
            All
          </Link>
        </div>
        {scriptCells}
        <div style={{ marginTop: '0.5em' }}>
          <Link
            activeClassName="bold"
            to={`/${organizationName}/directory?role=Archived`}>
            Archived
          </Link>
        </div>
      </div>
    );
  }

  render() {
    return (
      <div className="container-fluid">
        <div className="row">
          {this.renderRolesCol()}
          {this.props.children}
        </div>
      </div>
    );
  }
}

Directory.propTypes = {
  children: PropTypes.node.isRequired,
  location: PropTypes.object.isRequired,
  experiences: PropTypes.array.isRequired,
  profiles: PropTypes.array.isRequired,
  params: PropTypes.object.isRequired
};
