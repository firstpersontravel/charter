import _ from 'lodash';
import React from 'react';
import PropTypes from 'prop-types';

import ListItem from './ListItem';

import { newItemForSpec } from './utils';

function ListField({ script, resource, spec, value, name, path, opts,
  onPropUpdate, renderAny }) {
  const items = _.map(value, (item, i) => (
    <ListItem
      script={script}
      resource={resource}
      spec={spec}
      value={value}
      name={name}
      path={path}
      opts={opts}
      item={item}
      index={i}
      key={`${path}-${i}`}
      onPropUpdate={onPropUpdate}
      renderAny={renderAny} />
  ));
  const listIsEmpty = !value || value.length === 0;
  const newIndex = value ? value.length : 0;
  const newPath = `${path}[${newIndex}]`;
  const newItem = newItemForSpec(spec.items);
  const newBtnStyle = { display: listIsEmpty ? 'inline' : 'block' };
  const newItemBtn = (
    <div style={newBtnStyle}>
      <button
        className="btn btn-sm btn-outline-secondary"
        onClick={() => onPropUpdate(newPath, newItem)}>
        <i className="fa fa-plus" />
      </button>
    </div>
  );
  return (
    <div style={newBtnStyle}>
      {items}
      {newItemBtn}
    </div>
  );
}

ListField.defaultProps = { opts: {}, value: [] };
ListField.propTypes = {
  script: PropTypes.object.isRequired,
  resource: PropTypes.object.isRequired,
  onPropUpdate: PropTypes.func.isRequired,
  spec: PropTypes.object.isRequired,
  name: PropTypes.string.isRequired,
  path: PropTypes.string.isRequired,
  opts: PropTypes.object,
  value: PropTypes.array,
  renderAny: PropTypes.func.isRequired
};

export default ListField;
