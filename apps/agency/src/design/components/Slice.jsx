import _ from 'lodash';
import React, { Component } from 'react';
import PropTypes from 'prop-types';

import ContentTree from '../partials/ContentTree';
import ResponsiveNav from '../../partials/ResponsiveNav';

import { prepareContentTree } from '../utils/tree-utils';
import { sections, getContentList } from '../utils/section-utils';

export default class Slice extends Component {
  constructor(props) {
    super(props);
    this.state = {
      contentList: null,
      contentTree: null
    };
  }

  componentWillMount() {
    this.prepareContentTree(this.props);
  }

  componentWillReceiveProps(nextProps) {
    this.prepareContentTree(nextProps);
  }

  prepareContentTree(props) {
    const sliceType = props.params.sliceType;
    const sliceName = props.params.sliceName;
    const scriptContent = props.script.content;
    const contentList = getContentList(scriptContent, sliceType, sliceName);
    const contentTree = prepareContentTree(scriptContent, contentList);
    this.setState({
      contentList: contentList,
      contentTree: contentTree
    });
  }

  renderSidenav() {
    const script = this.props.script;
    const sceneLinks = _.map(script.content.scenes, scene => ({
      key: scene.name,
      url: `/${script.org.name}/${script.experience.name}/script/${script.revision}/design/scene/${scene.name}`,
      label: (
        <span>
          <i
            style={{ width: '1.5em' }}
            className="d-none d-md-inline-block fa fa-puzzle-piece" />
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

    const items = sectionLinks.concat(sceneLinks);

    return (
      <ResponsiveNav items={items} />
    );
  }

  render() {
    return (
      <div className="row row-eq-height script-editor-container">
        <div className="script-editor-col col-sm-2">
          <div className="script-editor-nav">
            {this.renderSidenav()}
          </div>
        </div>
        <div className="script-editor-col col-sm-3">
          <div className="script-editor-tree">
            <ContentTree
              sliceType={this.props.params.sliceType}
              sliceName={this.props.params.sliceName}
              contentList={this.state.contentList}
              contentTree={this.state.contentTree}
              script={this.props.script} />
          </div>
        </div>
        <div className="script-editor-resource col-sm-7">
          {this.props.children}
        </div>
      </div>
    );
  }
}

Slice.propTypes = {
  children: PropTypes.node.isRequired,
  params: PropTypes.object.isRequired,
  script: PropTypes.object.isRequired
};
