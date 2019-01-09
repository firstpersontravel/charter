import _ from 'lodash';
import React from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router';

import { getItems, doesCollectionHaveScene } from './utils';

function renderItem(script, collectionName, item, i) {
  const itemName = item.title || item.name;
  return (
    <div
      className="constrain-text"
      key={`${collectionName}-${item.name || i}`}>
      <Link
        activeClassName="bold"
        to={
          `/${script.org.name}/${script.experience.name}` +
          `/design/script/${script.id}` +
          `/collection/${collectionName}` +
          `/resource/${item.name || i}`
        }>
        {itemName}
      </Link>
    </div>
  );
}

export default function Collection({ script, children, params, location }) {
  const collectionName = params.collectionName;
  let items = getItems(script, collectionName);

  // Get current scene from either the resource (if we're looking at one)
  // or the scene name (if we're just browsing the collection from a link).
  let currentSceneName = location.query.scene;
  if (params.resourceName) {
    const resource = _.find(items, { name: params.resourceName });
    if (resource) {
      currentSceneName = resource.scene;
    }
  }

  // Filter items by scene name
  if (doesCollectionHaveScene(collectionName)) {
    items = items.filter(item => item.scene === currentSceneName);
  }

  const renderedItems = items.map((item, i) => (
    renderItem(script, collectionName, item, i)
  ));

  return [
    <div key="col2" className="script-editor-col col-2">
      {renderedItems}
    </div>,
    <div key="col3" className="script-editor-col col-8">
      {children}
    </div>
  ];
}

Collection.propTypes = {
  children: PropTypes.node.isRequired,
  location: PropTypes.object.isRequired,
  params: PropTypes.object.isRequired,
  script: PropTypes.object.isRequired
};
