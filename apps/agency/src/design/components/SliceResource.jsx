import _ from 'lodash';
import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { browserHistory } from 'react-router';

import { TextUtil } from 'fptcore';

import ResourceView from '../partials/ResourceView';
import { titleForResource } from './utils';

import PopoverControl from '../../partials/PopoverControl';

export default class SliceResource extends Component {
  constructor(props) {
    super(props);
    this.handlePropertyUpdate = this.handlePropertyUpdate.bind(this);
    this.redirectToRevision = null;
  }

  componentWillReceiveProps(nextProps) {
    if (nextProps.script.id !== this.props.script.id) {
      this.redirectToRevision = null;
    }
    if (this.redirectToRevision) {
      this.checkForNewRevision();
    }
  }

  getResource() {
    const collectionName = this.props.params.collectionName;
    const collection = this.props.script.content[collectionName];
    const resourceName = this.props.params.resourceName;
    return _.find(collection, { name: resourceName });
  }

  checkForNewRevision() {
    if (!this.redirectToRevision) {
      return;
    }
    const script = this.props.script;
    const collectionName = this.props.params.collectionName;
    const resourceName = this.props.params.resourceName;
    const existingRevisions = _.map(this.props.scripts, 'revision');
    if (_.includes(existingRevisions, this.redirectToRevision)) {
      browserHistory.push(
        `/${script.org.name}/${script.experience.name}` +
        `/design/script/${this.redirectToRevision}` +
        `/${this.props.params.sliceType}/${this.props.params.sliceName}` +
        `/${collectionName}/${resourceName}`
      );
    }
  }

  handlePropertyUpdate(path, newValue) {
    const script = this.props.script;
    const collectionName = this.props.params.collectionName;
    const resourceName = this.props.params.resourceName;
    const existingResource = _.cloneDeep(this.getResource());
    const updatedResource = _.set(existingResource, path, newValue);
    const existingScriptContent = this.props.script.content;
    const existingCollection = _.clone(existingScriptContent[collectionName]);
    const index = _.findIndex(existingCollection, { name: resourceName });
    const newCollection = _.set(existingCollection, `[${index}]`,
      updatedResource);
    const newScriptContent = _.assign({}, existingScriptContent, {
      [collectionName]: newCollection
    });

    if (script.isActive) {
      // If we're editing the active script, then make a new one
      const newRevision = script.revision + 1;
      this.props.createInstance('scripts', {
        orgId: script.orgId,
        experienceId: script.experienceId,
        revision: newRevision,
        contentVersion: 1,
        content: newScriptContent,
        isActive: false
      });
      this.redirectToRevision = newRevision;
    }

    this.props.updateInstance('scripts', script.id, {
      content: newScriptContent
    });
  }

  renderTitle() {
    const collectionName = this.props.params.collectionName;
    const resource = this.getResource();
    if (resource.title) {
      return (
        <PopoverControl
          title="Title"
          onConfirm={_.curry(this.handlePropertyUpdate)('title')}
          value={resource.title} />
      );
    }
    return titleForResource(collectionName, resource);
  }

  render() {
    const script = this.props.script;
    const collectionName = this.props.params.collectionName;
    const resourceType = TextUtil.singularize(collectionName);
    const resource = this.getResource();
    if (!resource) {
      return (
        <div>Not found.</div>
      );
    }
    return (
      <div>
        <div className="card" style={{ marginBottom: '1em' }}>
          <h5 className="card-header">
            <span className="badge badge-info">
              {TextUtil.titleForKey(resourceType)}
            </span>&nbsp;
            {this.renderTitle(resource)}
          </h5>
          <div className="card-body">
            <ResourceView
              script={script}
              collectionName={collectionName}
              resource={resource} />
          </div>
        </div>
      </div>
    );
  }
}

SliceResource.propTypes = {
  script: PropTypes.object.isRequired,
  scripts: PropTypes.array.isRequired,
  params: PropTypes.object.isRequired,
  createInstance: PropTypes.func.isRequired,
  updateInstance: PropTypes.func.isRequired
};
