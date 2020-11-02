import _ from 'lodash';
import React, { Component } from 'react';
import PropTypes from 'prop-types';

import { SceneCore, TextUtil } from 'fptcore';

import { titleForResource, titleForResourceType } from '../utils/text-utils';
import ResourceBadge from '../../partials/ResourceBadge';
import ResponsiveListGroup from '../../partials/ResponsiveListGroup';

function makeQueryString(params) {
  if (!params) {
    return '';
  }
  return `?${Object.keys(params)
    .map(k => `${encodeURIComponent(k)}=${encodeURIComponent(params[k])}`)
    .join('&')}`;
}

export default class ContentTree extends Component {
  renderResource(collectionName, resource, isNested) {
    const resourceType = TextUtil.singularize(collectionName);
    const script = this.props.script;
    const title = titleForResource(script.content, collectionName, resource);
    return ({
      key: `${collectionName}-${resource.name}`,
      url: (
        `/${script.org.name}/${script.experience.name}` +
        `/script/${script.revision}` +
        `/design/${this.props.sliceType}/${this.props.sliceName}` +
        `/${collectionName}/${resource.name}`
      ),
      text:
        `${isNested ? '- ' : ''}` +
        `${titleForResourceType(resourceType)}: ${title}`,
      label: (
        <span>
          <ResourceBadge
            showType={false}
            className={isNested ? 'ml-2' : ''}
            resource={resource}
            resourceType={resourceType} /> {title}
        </span>
      )
    });
  }

  renderNestedCollection(nestedCol) {
    return nestedCol.items.map(i => (
      this.renderResource(nestedCol.collection, i, true)
    ));
  }

  renderItem(collectionName, item) {
    const rootItem = this.renderResource(collectionName, item.resource, false);
    const nestedItems = _(item.nested)
      .map(i => this.renderNestedCollection(i))
      .flatten()
      .value();
    return [rootItem].concat(nestedItems);
  }

  renderNewItem(contentSection) {
    const collectionName = contentSection.collection;
    const script = this.props.script;
    const resourceType = TextUtil.singularize(collectionName);
    const queryString = makeQueryString(contentSection.filter);
    const title = contentSection.title ?
      contentSection.title :
      titleForResourceType(resourceType);
    return ({
      key: `${contentSection.key || collectionName}-new`,
      isActive: (match, location) => (
        match &&
        location.pathname === match.url &&
        location.search === queryString
      ),
      className: 'mb-3',
      url: {
        pathname: (
          `/${script.org.name}/${script.experience.name}` +
          `/script/${script.revision}` +
          `/design/${this.props.sliceType}/${this.props.sliceName}` +
          `/${collectionName}/new`
        ),
        search: queryString
      },
      text: `Add ${title.toLowerCase()}`,
      label: (
        <span style={{ opacity: 0.7 }}>
          <ResourceBadge
            className="mr-1"
            showType={false}
            resourceType={resourceType} />
          Add {title.toLowerCase()}
        </span>
      )
    });
  }

  renderContentSection(contentSection) {
    const collectionName = contentSection.collection;
    const resourceType = TextUtil.singularize(collectionName);
    const title = contentSection.title ?
      TextUtil.pluralize(contentSection.title) :
      TextUtil.pluralize(titleForResourceType(resourceType));
    const headerItem = {
      key: `${contentSection.key || collectionName}-header`,
      url: '',
      label: title,
      text: title,
      disabled: true
    };
    const items = _(contentSection.items)
      .sort((a, b) => SceneCore.sortResource(a.resource, b.resource))
      .map(item => (
        this.renderItem(contentSection.collection, item)
      ))
      .flatten()
      .value();

    const newItem = this.renderNewItem(contentSection);
    if (!items.length) {
      return [newItem];
    }

    return [headerItem]
      .concat(items)
      .concat([newItem]);
  }

  render() {
    const contentList = this.props.contentList;
    const allItems = _(contentList)
      .map(item => this.renderContentSection(item))
      .flatten()
      .value();

    return (
      <ResponsiveListGroup items={allItems} history={this.props.history} />
    );
  }
}

ContentTree.propTypes = {
  sliceType: PropTypes.string.isRequired,
  sliceName: PropTypes.string.isRequired,
  contentList: PropTypes.array.isRequired,
  script: PropTypes.object.isRequired,
  history: PropTypes.object.isRequired
};
