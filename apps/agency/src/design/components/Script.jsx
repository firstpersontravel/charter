import _ from 'lodash';
import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router';

import { sections } from './utils';

export default class Script extends Component {
  renderNav() {
    const script = this.props.script;
    const sceneLinks = _.map(script.content.scenes, scene => (
      <Link
        key={scene.name}
        className="dropdown-item"
        to={`/${script.org.name}/${script.experience.name}/design/script/${script.id}/scene/${scene.name}`}>
        {scene.title}
      </Link>
    ));

    const sectionLinks = sections.map(section => (
      <li key={section[0]} className="nav-item">
        <Link
          className="nav-link"
          activeClassName="active"
          to={`/${script.org.name}/${script.experience.name}/design/script/${script.id}/section/${section[0]}`}>
          {section[1]}
        </Link>
      </li>
    ));

    const hasScenes = !!_.get(script, 'content.scenes.length');
    let sceneTitle = 'Scenes';
    if (this.props.params.sliceType === 'scene') {
      const sceneName = this.props.params.sliceName;
      const scene = _.find(script.content.scenes, { name: sceneName });
      if (scene) {
        sceneTitle = `Scene: ${scene.title}`;
      }
    }

    return (
      <ul className="nav nav-tabs">
        {sectionLinks}
        <li className="nav-item dropdown">
          <Link
            className={`nav-link dropdown-toggle ${hasScenes ? '' : 'disabled'}`}
            activeClassName="active"
            data-toggle="dropdown"
            to={`/${script.org.name}/${script.experience.name}/design/script/${script.id}/scene`}>
            {sceneTitle}
          </Link>
          <div className="dropdown-menu">
            {sceneLinks}
          </div>
        </li>
      </ul>
    );
  }

  renderOpts() {
    return (
      <div style={{ textAlign: 'right', padding: '0.5em' }}>
        Revision {this.props.script.revision}
      </div>
    );
  }

  render() {
    if (this.props.script.isLoading) {
      return <div className="container-fluid">Loading</div>;
    }
    if (this.props.script.isError) {
      return <div className="container-fluid">Error</div>;
    }
    if (this.props.script.isNull) {
      return <div className="container-fluid">Script not found.</div>;
    }
    return (
      <div className="container-fluid">
        <div className="row">
          <div className="col-10">
            {this.renderNav()}
          </div>
          <div className="col-2">
            {this.renderOpts()}
          </div>
        </div>
        {this.props.children}
      </div>
    );
  }
}

Script.propTypes = {
  children: PropTypes.node.isRequired,
  script: PropTypes.object.isRequired,
  params: PropTypes.object.isRequired
};
