import _ from 'lodash';
import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router';

import ContentTree from '../partials/ContentTree';

import { prepareContentTree } from '../utils/tree-utils';
import { sections, getContentList } from '../utils/section-utils';

export default class Slice extends Component {
  constructor(props) {
    super(props);
    this.state = {
      search: '',
      contentList: null,
      contentTree: null
    };
    this.handleChangeSearch = this.handleChangeSearch.bind(this);
  }

  componentWillMount() {
    this.prepareContentTree(this.props);
  }

  componentWillReceiveProps(nextProps) {
    if (nextProps.params.sliceType !== this.props.params.sliceType ||
        nextProps.params.sliceName !== this.props.params.sliceName) {
      this.setState({ search: '' });
    }
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

  handleChangeSearch(e) {
    this.setState({
      search: e.target.value
    });
  }

  renderSidenav() {
    const script = this.props.script;
    const sceneLinks = _.map(script.content.scenes, scene => (
      <Link
        key={scene.name}
        className="list-group-item"
        activeClassName="active"
        to={`/${script.org.name}/${script.experience.name}/design/script/${script.revision}/scene/${scene.name}`}>
        {scene.title}
      </Link>
    ));

    const sectionLinks = sections.map(section => (
      <Link
        key={section[0]}
        className="list-group-item"
        activeClassName="active"
        to={`/${script.org.name}/${script.experience.name}/design/script/${script.revision}/section/${section[0]}`}>
        {section[1]}
      </Link>
    ));

    return (
      <div className="list-group list-group-flush">
        {sectionLinks}
        {sceneLinks}
      </div>
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
              search={this.state.search}
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
