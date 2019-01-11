import React, { Component } from 'react';
import PropTypes from 'prop-types';

import ContentTree from '../partials/ContentTree';

import { prepareContentTree } from '../utils/tree-utils';
import { getContentList } from '../utils/section-utils';

export default class Slice extends Component {
  constructor(props) {
    super(props);
    this.state = { search: '' };
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
    const scriptContent = this.props.script.content;
    this.contentList = getContentList(scriptContent, sliceType, sliceName);
    this.contentTree = prepareContentTree(scriptContent, this.contentList);
  }

  handleChangeSearch(e) {
    this.setState({
      search: e.target.value
    });
  }

  render() {
    return (
      <div className="row row-eq-height script-editor-container">
        <div className="script-editor-col col-4">
          <div
            className="input-group script-editor-tree-search"
            style={{ marginBottom: '0.5em' }}>
            <input
              className="form-control py-2 border-right-0 border"
              type="search"
              value={this.state.search}
              onChange={this.handleChangeSearch} />
            <span className="input-group-append">
              <div className="input-group-text bg-transparent">
                <i className="fa fa-search" />
              </div>
            </span>
          </div>
          <div className="script-editor-tree">
            <ContentTree
              sliceType={this.props.params.sliceType}
              sliceName={this.props.params.sliceName}
              contentList={this.contentList}
              contentTree={this.contentTree}
              search={this.state.search}
              script={this.props.script} />
          </div>
        </div>
        <div className="script-editor-resource col-8">
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
