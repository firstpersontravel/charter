import _ from 'lodash';
import React from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router';

import { TextCore } from 'fptcore';

import { getItems, doesCollectionHaveScene } from './utils';

function renderItem(script, collectionName, item, i) {
  const itemName = item.title || item.name || i;
  return (
    <div
      className="constrain-text"
      key={`${collectionName}-${item.name || i}`}>
      <Link
        activeClassName="bold"
        to={
          `/agency/scripts/version/${script.id}` +
          `/collection/${collectionName}` +
          `/resource/${item.name || i}`
        }>
        {itemName}
      </Link>
    </div>
  );
}

export default function Collection({ script, collectionName, children, params, location }) {
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

  return (
    <div>
      <div className="row">
        <div className="col-sm-4">
          <h3>{TextCore.titleForKey(collectionName)}</h3>
          {renderedItems}
        </div>
        <div className="col-sm-8">
          {children}
        </div>
      </div>
    </div>
  );
}

Collection.propTypes = {
  children: PropTypes.node,
  collectionName: PropTypes.string,
  location: PropTypes.object.isRequired,
  params: PropTypes.object,
  script: PropTypes.object
};
