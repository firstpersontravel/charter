import _ from 'lodash';
import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { Link, browserHistory } from 'react-router';

import { sections } from '../utils/section-utils';

export default class Script extends Component {
  constructor(props) {
    super(props);
    this.handleActivateScript = this.handleActivateScript.bind(this);
    this.handleRevertScript = this.handleRevertScript.bind(this);
  }

  handleActivateScript() {
    // Activate this script.
    this.props.updateInstance('scripts', this.props.script.id, {
      isActive: true
    });

    // Deactivate other scripts.
    _.each(this.props.scripts, (otherScript) => {
      if (otherScript.id === this.props.script.id) {
        return;
      }
      if (otherScript.isActive) {
        this.props.updateInstance('scripts', otherScript.id, {
          isActive: false
        });
      } else {
        this.props.updateInstance('scripts', otherScript.id, {
          isArchived: true
        });
      }
    });
  }

  handleRevertScript() {
    const activeScript = _.find(this.props.scripts, { isActive: true });
    if (!activeScript) {
      return;
    }
    this.props.updateInstance('scripts', this.props.script.id, {
      isArchived: true
    });
    browserHistory.push(`/${activeScript.org.name}/${activeScript.experience.name}/design/script/${activeScript.revision}/${this.props.params.sliceType}/${this.props.params.sliceName}`);
  }

  renderNav() {
    const script = this.props.script;
    const sceneLinks = _.map(script.content.scenes, scene => (
      <Link
        key={scene.name}
        className="dropdown-item"
        to={`/${script.org.name}/${script.experience.name}/design/script/${script.revision}/scene/${scene.name}`}>
        {scene.title}
      </Link>
    ));

    const sectionLinks = sections.map(section => (
      <li key={section[0]} className="nav-item">
        <Link
          className="nav-link"
          activeClassName="active"
          to={`/${script.org.name}/${script.experience.name}/design/script/${script.revision}/section/${section[0]}`}>
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
            to={`/${script.org.name}/${script.experience.name}/design/script/${script.revision}/scene`}>
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
    const script = this.props.script;
    const maxRevision = Math.max(..._.map(this.props.scripts, 'revision'));
    const isMaxRevision = script.revision === maxRevision;
    const activeRevision = _.get(_.find(this.props.scripts,
      { isActive: true }), 'revision') || 0;
    const isSuperceded = script.revision < activeRevision;
    const badgeClass = script.isActive ? 'badge-primary' : 'badge-secondary';
    const statusText = script.isActive ? 'Active' : 'Draft';
    const status = (
      <span
        style={{ marginLeft: '0.25em' }}
        className={`badge ${badgeClass}`}>
        {isSuperceded ? 'Superceded' : statusText}
      </span>
    );

    const revertBtn = activeRevision ? (
      <button
        style={{ marginLeft: '0.25em' }}
        onClick={this.handleRevertScript}
        className="btn btn-xs btn-outline-secondary">
        <i className="fa fa-undo" />&nbsp;
        Revert to {activeRevision}
      </button>
    ) : null;

    const activateBtn = (
      <button
        style={{ marginLeft: '0.25em' }}
        onClick={this.handleActivateScript}
        className="btn btn-xs btn-outline-secondary">
        <i className="fa fa-check" />&nbsp;
        Activate
      </button>
    );

    const activateBtns = !script.isActive && isMaxRevision ? (
      <span>
        {revertBtn}
        {activateBtn}
      </span>
    ) : null;
    const goToLatestLink = !isMaxRevision ? (
      <span style={{ marginLeft: '0.25em', padding: '0' }}>
        <Link to={`/${script.org.name}/${script.experience.name}/design/script/${maxRevision}`}>
          Go to {maxRevision}
        </Link>
      </span>
    ) : null;
    return (
      <div style={{ float: 'right', padding: '0.5em' }}>
        Rev. {this.props.script.revision}
        {status}
        {activateBtns}
        {goToLatestLink}
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
        {this.renderOpts()}
        {this.renderNav()}
        {this.props.children}
      </div>
    );
  }
}

Script.propTypes = {
  children: PropTypes.node.isRequired,
  script: PropTypes.object.isRequired,
  scripts: PropTypes.array.isRequired,
  params: PropTypes.object.isRequired,
  updateInstance: PropTypes.func.isRequired
};
