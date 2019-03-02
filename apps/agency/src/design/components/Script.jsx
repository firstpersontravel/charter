import _ from 'lodash';
import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { Link, browserHistory } from 'react-router';

import ExperienceModal from '../../app/partials/ExperienceModal';
import AreYouSure from '../../partials/AreYouSure';
import { sections } from '../utils/section-utils';
import { withLoader } from '../../loader-utils';

function getBadgesForScript(script, maxRevision) {
  const badges = [];
  if (script.isActive) {
    badges.push(
      <span
        key="active"
        style={{ marginLeft: '0.5em' }} className="badge badge-primary">
        Active
      </span>
    );
  } else if (script.revision === maxRevision) {
    badges.push(
      <span
        key="draft"
        style={{ marginLeft: '0.5em' }} className="badge badge-secondary">
        Draft
      </span>
    );
  }

  if (script.isLocked) {
    badges.push(
      <span
        key="locked"
        style={{ marginLeft: '0.5em' }} className="badge badge-warning">
        Locked
      </span>
    );
  }
  return badges;
}

class Script extends Component {
  constructor(props) {
    super(props);
    this.handleActivateScript = this.handleActivateScript.bind(this);
    this.handleRevertScript = this.handleRevertScript.bind(this);
    this.handleLockScript = this.handleLockScript.bind(this);
    this.handleNewDraft = this.handleNewDraft.bind(this);
    this.handleUpdateExperience = this.handleUpdateExperience.bind(this);
    this.handleArchiveExperienceToggle = this.handleArchiveExperienceToggle
      .bind(this);
    this.handleArchiveExperienceConfirm = this.handleArchiveExperienceConfirm
      .bind(this);
    this.state = { isArchiveExperienceModalOpen: false };
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

  handleNewDraft() {
    const script = this.props.script;
    const maxRevision = Math.max(..._.map(this.props.scripts, 'revision'));
    const nextRevision = maxRevision + 1;
    this.props.createInstance('scripts', {
      orgId: script.orgId,
      experienceId: script.experienceId,
      content: script.content,
      revision: nextRevision,
      isActive: false
    });
    browserHistory.push(`/${script.org.name}/${script.experience.name}/script/${nextRevision}/design/${this.props.params.sliceType}/${this.props.params.sliceName}`);
  }

  handleLockScript() {
    this.props.updateInstance('scripts', this.props.script.id, {
      isLocked: !this.props.script.isLocked
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
    browserHistory.push(
      `/${activeScript.org.name}/${activeScript.experience.name}` +
      `/script/${activeScript.revision}` +
      `/design/${this.props.params.sliceType}/${this.props.params.sliceName}`
    );
  }

  handleArchiveExperienceToggle() {
    this.setState({
      isArchiveExperienceModalOpen: !this.state.isArchiveExperienceModalOpen
    });
  }

  handleArchiveExperienceConfirm() {
    const experience = this.props.script.experience;
    this.props.updateInstance('experiences', experience.id, {
      isArchived: true
    });
    browserHistory.push(`${this.props.params.orgName}`);
  }

  handleUpdateExperience(fields) {
    const experience = this.props.script.experience;
    this.props.updateInstance('experiences', experience.id, fields);
    browserHistory.push(
      `${this.props.params.orgName}/${fields.name}` +
      `/script/${this.props.script.revision}`
    );
  }

  renderNav() {
    const script = this.props.script;
    const sceneLinks = _.map(script.content.scenes, scene => (
      <Link
        key={scene.name}
        className="dropdown-item"
        to={`/${script.org.name}/${script.experience.name}/script/${script.revision}/design/scene/${scene.name}`}>
        {scene.title}
      </Link>
    ));

    const sectionLinks = sections.map(section => (
      <li key={section[0]} className="nav-item">
        <Link
          className="nav-link"
          activeClassName="active"
          to={`/${script.org.name}/${script.experience.name}/script/${script.revision}/design/section/${section[0]}`}>
          {section[1]}
        </Link>
      </li>
    ));

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
            className="nav-link dropdown-toggle"
            activeClassName="active"
            data-toggle="dropdown"
            to={`/${script.org.name}/${script.experience.name}/script/${script.revision}/design/scene`}>
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
    const badges = getBadgesForScript(script);
    const revertBtn = activeRevision ? (
      <button
        style={{ marginLeft: '0.5em' }}
        onClick={this.handleRevertScript}
        className="btn btn-xs btn-outline-secondary">
        <i className="fa fa-undo" />&nbsp;
        Revert to {activeRevision}
      </button>
    ) : null;

    const activateBtn = (
      <button
        style={{ marginLeft: '0.5em' }}
        onClick={this.handleActivateScript}
        className="btn btn-xs btn-outline-secondary">
        <i className="fa fa-check" />&nbsp;
        Activate
      </button>
    );

    const newDraftBtn = (
      <button
        style={{ marginLeft: '0.5em' }}
        onClick={this.handleNewDraft}
        className="btn btn-xs btn-outline-secondary">
        <i className="fa fa-pencil" />&nbsp;
        New draft
      </button>
    );

    const lockBtn = (
      <button
        style={{ marginLeft: '0.5em' }}
        onClick={this.handleLockScript}
        className="btn btn-xs btn-outline-secondary">
        <i className={`fa ${script.isLocked ? 'fa-unlock' : 'fa-lock'}`} />&nbsp;
        {script.isLocked ? 'Unlock' : 'Lock'}
      </button>
    );

    const activateBtns = !script.isActive && isMaxRevision ? (
      <span>
        {revertBtn}
        {activateBtn}
      </span>
    ) : null;

    const newDraftBtns = isMaxRevision && (script.isActive || script.isLocked) ?
      newDraftBtn : null;

    const goToLatestLink = !isMaxRevision ? (
      <span style={{ marginLeft: '0.5em', padding: '0' }}>
        <Link to={`/${script.org.name}/${script.experience.name}/script/${maxRevision}/design`}>
          Go to {maxRevision}
        </Link>
      </span>
    ) : null;

    const scriptRevisions = this.props.scripts.map(s => (
      <Link
        key={s.id}
        className="dropdown-item"
        to={`/${script.org.name}/${script.experience.name}/script/${s.revision}/design`}>
        Rev {s.revision} {getBadgesForScript(s, maxRevision)}
      </Link>
    ));

    const expOpts = (
      <div className="dropdown" style={{ cursor: 'pointer', marginLeft: '0.5em', display: 'inline' }}>
        <span id="expDropdown" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
          <i className="fa fa-gear" />
        </span>
        <div className="dropdown-menu dropdown-menu-right" aria-labelledby="expDropdown">
          <Link
            className="dropdown-item"
            to={`${window.location.pathname}?editing=true`}>
            Edit experience
          </Link>
          <button
            className="dropdown-item"
            onClick={this.handleArchiveExperienceToggle}
            type="button">
            Archive experience
          </button>
        </div>
      </div>
    );

    return (
      <div style={{ backgroundColor: '#eee' }}>
        <div
          className="container-fluid"
          style={{
            margin: 0,
            padding: '0.5em 1em'
          }}>
          <div className="row">
            <div className="col-sm-6">
              <Link
                activeClassName="bold"
                to={`/${script.org.name}/${script.experience.name}/script/${script.revision}/design`}>
                Design
              </Link>
              &nbsp;|&nbsp;
              <Link
                activeClassName="bold"
                to={`/${script.org.name}/${script.experience.name}/script/${script.revision}/test`}>
                Test
              </Link>
              &nbsp;|&nbsp;
              <Link
                activeClassName="bold"
                to={`/${script.org.name}/${script.experience.name}/script/${script.revision}/reference`}>
                Reference
              </Link>
            </div>
            <div className="col-sm-6 align-right-sm">
              <button className="dropdown btn btn-unstyled dropdown-toggle" type="button" id="scriptRevs" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
                Rev. {this.props.script.revision}
              </button>
              <div className="dropdown-menu" aria-labelledby="scriptRevs">
                {scriptRevisions}
              </div>
              {badges}
              {activateBtns}
              {script.isActive ? lockBtn : null}
              {newDraftBtns}
              {goToLatestLink}
              {expOpts}
            </div>
          </div>
        </div>
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

    const isEditingExperience = !!this.props.location.query.editing;

    return (
      <div>
        {this.renderOpts()}
        <div className="container-fluid">
          {this.props.children}
        </div>

        <ExperienceModal
          isOpen={isEditingExperience}
          experience={this.props.script.experience}
          onClose={() => browserHistory.push(window.location.pathname)}
          onConfirm={this.handleUpdateExperience} />

        <AreYouSure
          isOpen={this.state.isArchiveExperienceModalOpen}
          onToggle={this.handleArchiveExperienceToggle}
          onConfirm={this.handleArchiveExperienceConfirm}
          message="Are you sure you want to archive this experience?" />
      </div>
    );
  }
}

Script.propTypes = {
  children: PropTypes.node.isRequired,
  script: PropTypes.object.isRequired,
  scripts: PropTypes.array.isRequired,
  params: PropTypes.object.isRequired,
  location: PropTypes.object.isRequired,
  createInstance: PropTypes.func.isRequired,
  updateInstance: PropTypes.func.isRequired
};

export default withLoader(Script, ['script.id'], (props) => {
  props.listCollection('assets', {
    experienceId: props.script.experienceId,
    orgId: props.script.orgId
  });
});
