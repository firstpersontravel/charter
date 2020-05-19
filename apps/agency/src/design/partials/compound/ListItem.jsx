import React from 'react';
import PropTypes from 'prop-types';

import { coreWalker } from 'fptcore';

function ListItem({ script, resource, spec, value, name, path, opts,
  item, index, onPropUpdate, renderAny }) {
  const AnyField = renderAny;
  const itemPath = `${path}[${index}]`;
  let isRemoveDisabled = false;
  if (spec.items.type === 'component') {
    const refs = coreWalker.getResourcesReferencingComponent(
      script.content, spec.items.component, item.id);
    if (refs.length > 0) {
      isRemoveDisabled = true;
    }
  }
  const rmBtn = (
    <button
      className="btn btn-sm btn-outline-secondary"
      title={isRemoveDisabled ? 'Cannot remove: other resources are referencing this item.' : ''}
      disabled={isRemoveDisabled}
      onClick={() => {
        const updated = value.slice(0, index).concat(value.slice(index + 1));
        onPropUpdate(path, updated);
      }}>
      <i className="fa fa-minus" />
    </button>
  );
  return (
    // eslint-disable-next-line react/no-array-index-key
    <div key={index}>
      <div style={{ float: 'left' }}>
        {rmBtn}
      </div>
      <div style={{ marginLeft: '2em' }}>
        <AnyField
          script={script}
          resource={resource}
          onPropUpdate={onPropUpdate}
          spec={spec.items}
          value={item}
          name={`${name} Item`}
          path={itemPath}
          opts={opts} />
      </div>
    </div>
  );
}

ListItem.defaultProps = { opts: {}, value: [] };
ListItem.propTypes = {
  script: PropTypes.object.isRequired,
  resource: PropTypes.object.isRequired,
  onPropUpdate: PropTypes.func.isRequired,
  spec: PropTypes.object.isRequired,
  name: PropTypes.string.isRequired,
  path: PropTypes.string.isRequired,
  opts: PropTypes.object,
  value: PropTypes.array,
  item: PropTypes.any.isRequired,
  index: PropTypes.number.isRequired,
  renderAny: PropTypes.func.isRequired
};

export default ListItem;
