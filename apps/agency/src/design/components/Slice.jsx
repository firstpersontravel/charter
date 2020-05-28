import React, { Component } from 'react';
import PropTypes from 'prop-types';

import { SceneCore, coreRegistry } from 'fptcore';

import ContentTree from '../partials/ContentTree';
import ResponsiveListGroup from '../../partials/ResponsiveListGroup';

import { sections, getContentList } from '../utils/section-utils';

export default class Slice extends Component {
  renderSidenav() {
    const script = this.props.script;
    const sceneLinks = (script.content.scenes || [])
      .sort(SceneCore.sortResource)
      .map(scene => ({
        key: scene.name,
        url: `/${script.org.name}/${script.experience.name}/script/${script.revision}/design/scene/${scene.name}`,
        label: (
          <span>
            <i
              style={{ width: '1.5em' }}
              className={
                'd-none d-md-inline-block fa ' +
                `fa-${coreRegistry.resources.scene.icon(scene)}`
              } />
            &nbsp;{scene.title}
          </span>
        ),
        text: scene.title
      }));

    const sectionLinks = sections.map(section => ({
      key: section[0],
      url: `/${script.org.name}/${script.experience.name}/script/${script.revision}/design/section/${section[0]}`,
      label: (
        <span>
          <i
            style={{ width: '1.5em' }}
            className={`d-none d-md-inline-block fa fa-${section[2]}`} />
          &nbsp;{section[1]}
        </span>
      ),
      text: section[1]
    }));

    const globalHeader = {
      key: 'global-header',
      url: '',
      label: 'Project',
      text: 'Project',
      disabled: true
    };

    const scenesHeader = {
      key: 'scenes-header',
      url: '',
      label: 'Scenes',
      text: 'Scenes',
      disabled: true
    };

    const sceneListItem = {
      key: 'scenes',
      url: `/${script.org.name}/${script.experience.name}/script/${script.revision}/design/section/scenes`,
      label: (
        <span>
          <i
            style={{ width: '1.5em' }}
            className="d-none d-md-inline-block fa fa-puzzle-piece" />
          &nbsp;Scene list
        </span>
      ),
      text: 'Scene list'
    };

    const items = [globalHeader]
      .concat(sectionLinks)
      .concat([scenesHeader, sceneListItem])
      .concat(sceneLinks);

    return (
      <ResponsiveListGroup items={items} history={this.props.history} />
    );
  }

  render() {
    const sliceType = this.props.match.params.sliceType;
    const sliceName = this.props.match.params.sliceName;
    const scriptContent = this.props.script.content;
    const contentList = getContentList(scriptContent, sliceType, sliceName);
    return (
      <div className="row row-eq-height script-editor-container">
        <div className="script-editor-col col-sm-2">
          <div className="script-editor-nav script-editor-col">
            {this.renderSidenav()}
          </div>
        </div>
        <div className="script-editor-col col-sm-3">
          <div className="script-editor-tree script-editor-col">
            <ContentTree
              sliceType={this.props.match.params.sliceType}
              sliceName={this.props.match.params.sliceName}
              contentList={contentList}
              script={this.props.script}
              history={this.props.history} />
          </div>
        </div>
        <div className="script-editor-resource script-editor-col col-sm-7">
          {this.props.children}
        </div>
      </div>
    );
  }
}

Slice.propTypes = {
  children: PropTypes.node.isRequired,
  match: PropTypes.object.isRequired,
  history: PropTypes.object.isRequired,
  script: PropTypes.object.isRequired
};
