import React from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router';

import { TextCore } from 'fptcore';

import { getItems } from './utils';

function renderItem(script, collectionName, item, i) {
  const itemName = item.name || i;
  return (
    <div className="constrain-text" key={itemName}>
      <Link
        activeClassName="bold"
        to={
          `/agency/scripts/version/${script.id}` +
          `/collection/${collectionName}` +
          `/resource/${itemName}`
        }>
        {itemName}
      </Link>
    </div>
  );
}

export default function Collection({ script, collectionName, children }) {
  const items = getItems(script, collectionName);
  const renderedItems = items.map((item, i) => (
    renderItem(script, collectionName, item, i)
  ));
  return (
    <div className="row">
      <div className="col-sm-4">
        <h3>{TextCore.titleForKey(collectionName)}</h3>
        {renderedItems}
      </div>
      <div className="col-sm-8">
        {children}
      </div>
    </div>
  );
}

Collection.propTypes = {
  children: PropTypes.node,
  script: PropTypes.object,
  collectionName: PropTypes.string
};
