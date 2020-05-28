import _ from 'lodash';
import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { NavLink, Link } from 'react-router-dom';

import ExperienceModal from '../../app/partials/ExperienceModal';
import Alert from '../../partials/Alert';
import AreYouSure from '../../partials/AreYouSure';
import Loader from '../../partials/Loader';
import { sections } from '../utils/section-utils';
import { withLoader } from '../../loader-utils';

function getBadgesForScript(script, maxRevision) {
  const badges = [];
  if (script.isActive) {
    badges.push(
      <span key="active" className="badge badge-primary ml-2">Active</span>
    );
  } else if (script.revision === maxRevision) {
    badges.push(
      <span key="draft" className="badge badge-secondary ml-2">Draft</span>
    );
  }

  if (script.isLocked) {
    badges.push(
      <span key="locked" className="badge badge-warning ml-2">Locked</span>
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
    this.handleUndo = this.handleUndo.bind(this);
    this.handleRedo = this.handleRedo.bind(this);
    this.state = {
      isArchiveExperienceModalOpen: false,
      revisionHistoryIndex: props.revisionHistory.length - 1
    };
  }

  componentWillReceiveProps(nextProps) {
    if (this.props.script.id !== nextProps.script.id ||
      this.props.revisionHistoryUpdated !== nextProps.revisionHistoryUpdated) {
      this.setState({
        revisionHistoryIndex: nextProps.revisionHistory.length - 1
      });
    }
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
    const path = this.props.location.pathname;
    const [sliceType, sliceName] = path.split('/').slice(-2);
    this.props.history.push(
      `/${script.org.name}/${script.experience.name}/script` +
      `/${nextRevision}/design/${sliceType}/${sliceName}`);
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
    const path = this.props.location.pathname;
    const [sliceType, sliceName] = path.split('/').slice(-2);
    this.props.history.push(
      `/${activeScript.org.name}/${activeScript.experience.name}` +
      `/script/${activeScript.revision}` +
      `/design/${sliceType}/${sliceName}`);
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
    const expFilters = {
      orgId: experience.orgId,
      experienceId: experience.id
    };
    this.props.bulkUpdate('groups', expFilters, { isArchived: true });
    this.props.bulkUpdate('trips', expFilters, { isArchived: true });
    this.props.bulkUpdate('relays', expFilters, { isActive: false });
    this.props.history.push(`/${this.props.match.params.orgName}`);
  }

  handleUpdateExperience(example, fields) {
    const experience = this.props.script.experience;
    this.props.updateInstance('experiences', experience.id, fields);
    this.props.history.push(
      `/${this.props.match.params.orgName}/${fields.name}` +
      `/script/${this.props.script.revision}`);
  }

  handleUndo() {
    const nextIndex = this.state.revisionHistoryIndex - 1;
    if (nextIndex < 0) {
      return;
    }
    this.updateScriptToRevisionHistoryIndex(nextIndex);
  }

  handleRedo() {
    const nextIndex = this.state.revisionHistoryIndex + 1;
    if (nextIndex >= this.props.revisionHistory.length) {
      return;
    }
    this.updateScriptToRevisionHistoryIndex(nextIndex);
  }

  updateScriptToRevisionHistoryIndex(revisionHistoryIndex) {
    const scriptId = this.props.script.id;
    const revisionContent = this.props.revisionHistory[revisionHistoryIndex];
    this.props.updateInstance('scripts', scriptId, {
      content: revisionContent
    });
    this.setState({ revisionHistoryIndex: revisionHistoryIndex });
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
        <NavLink
          className="nav-link"
          activeClassName="active"
          to={`/${script.org.name}/${script.experience.name}/script/${script.revision}/design/section/${section[0]}`}>
          {section[1]}
        </NavLink>
      </li>
    ));

    let sceneTitle = 'Scenes';
    const path = this.props.location.pathname;
    const [sliceType, sliceName] = path.split('/').slice(-2);
    if (sliceType === 'scene') {
      const scene = _.find(script.content.scenes, { name: sliceName });
      if (scene) {
        sceneTitle = `Scene: ${scene.title}`;
      }
    }

    return (
      <ul className="nav nav-tabs">
        {sectionLinks}
        <li className="nav-item dropdown">
          <NavLink
            className="nav-link dropdown-toggle"
            activeClassName="active"
            data-toggle="dropdown"
            to={`/${script.org.name}/${script.experience.name}/script/${script.revision}/design/scene`}>
            {sceneTitle}
          </NavLink>
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
        onClick={this.handleRevertScript}
        className="btn btn-xs btn-outline-secondary ml-2">
        <i className="fa fa-undo" />&nbsp;
        Revert to {activeRevision}
      </button>
    ) : null;

    const activateBtn = (
      <button
        onClick={this.handleActivateScript}
        className="btn btn-xs btn-outline-secondary ml-2">
        <i className="fa fa-check" />&nbsp;
        Activate
      </button>
    );

    const newDraftBtn = (
      <button
        onClick={this.handleNewDraft}
        className="btn btn-xs btn-outline-secondary ml-2">
        <i className="fa fa-pencil" />&nbsp;
        New draft
      </button>
    );

    const lockBtn = (
      <button
        onClick={this.handleLockScript}
        className="btn btn-xs btn-outline-secondary ml-2">
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

    const newDraftBtns = isMaxRevision && (script.isActive || script.isLocked)
      ? newDraftBtn : null;

    const historyLength = this.props.revisionHistory.length;
    const curHistoryIndex = this.state.revisionHistoryIndex;
    const numUndosAvail = curHistoryIndex;
    const numRedosAvail = historyLength - curHistoryIndex - 1;
    const undoBtn = (
      <button
        disabled={numUndosAvail <= 0}
        onClick={this.handleUndo}
        className="btn btn-xs btn-outline-secondary ml-2">
        <i className="fa fa-undo" />&nbsp;
        Undo
      </button>
    );

    const redoBtn = (
      <button
        disabled={numRedosAvail <= 0}
        onClick={this.handleRedo}
        className="btn btn-xs btn-outline-secondary ml-2">
        <i className="fa fa-rotate-right" />&nbsp;
        Redo
      </button>
    );

    const goToLatestLink = !isMaxRevision ? (
      <span className="ml-2 p-0">
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
      <div className="dropdown ml-2 d-inline" style={{ cursor: 'pointer' }}>
        <span id="expDropdown" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
          <i className="fa fa-gear" />
        </span>
        <div className="dropdown-menu dropdown-menu-right" aria-labelledby="expDropdown">
          <Link
            className="dropdown-item"
            to={`${window.location.pathname}?editing=true`}>
            Edit project
          </Link>
          <button
            className="dropdown-item"
            onClick={this.handleArchiveExperienceToggle}
            type="button">
            Archive project
          </button>
        </div>
      </div>
    );

    return (
      <div style={{ backgroundColor: '#eee' }}>
        <div className="container-fluid m-0 px-3 py-2">
          <div className="row">
            <div className="col-sm-3">
              <NavLink
                activeClassName="bold"
                to={`/${script.org.name}/${script.experience.name}/script/${script.revision}/design`}>
                Create
              </NavLink>
              &nbsp;|&nbsp;
              <NavLink
                activeClassName="bold"
                to={`/${script.org.name}/${script.experience.name}/script/${script.revision}/test`}>
                Preview
              </NavLink>
            </div>
            <div className="col-sm-9 align-right-sm">
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
              {undoBtn}
              {redoBtn}
              {goToLatestLink}
              {expOpts}
            </div>
          </div>
        </div>
      </div>
    );
  }

  render() {
    if (this.props.script.isLoading || this.props.isCreatingScript) {
      return <Loader />;
    }
    if (this.props.script.isError) {
      return (
        <Alert
          color="danger"
          content="Error loading script."
          action={
            <Link to={`/${this.props.match.params.orgName}`}>Go back?</Link>
          } />
      );
    }
    if (this.props.script.isNull) {
      return (
        <Alert
          color="warning"
          content="Script not found."
          action={
            <Link to={`/${this.props.match.params.orgName}`}>Go back?</Link>
          } />
      );
    }

    const query = new URLSearchParams(this.props.location.search);
    const isEditingExperience = !!query.get('editing');

    return (
      <div>
        {this.renderOpts()}
        <div className="container-fluid">
          {this.props.children}
        </div>

        <ExperienceModal
          isOpen={isEditingExperience}
          experience={this.props.script.experience}
          existingExperiences={this.props.experiences}
          onClose={() => this.props.history.push(window.location.pathname)}
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
  isCreatingScript: PropTypes.bool.isRequired,
  script: PropTypes.object.isRequired,
  scripts: PropTypes.array.isRequired,
  revisionHistory: PropTypes.array.isRequired,
  revisionHistoryUpdated: PropTypes.number,
  experiences: PropTypes.array.isRequired,
  match: PropTypes.object.isRequired,
  location: PropTypes.object.isRequired,
  history: PropTypes.object.isRequired,
  createInstance: PropTypes.func.isRequired,
  updateInstance: PropTypes.func.isRequired,
  bulkUpdate: PropTypes.func.isRequired
};

Script.defaultProps = {
  revisionHistoryUpdated: null
};

export default withLoader(Script, ['script.id'], (props) => {
  props.listCollection('assets', {
    experienceId: props.script.experienceId,
    orgId: props.script.orgId
  });
});
