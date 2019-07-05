import _ from 'lodash';
import React from 'react';
import PropTypes from 'prop-types';

import BaseClear from '../fields/BaseClear';
import { newItemsForSpecType } from './utils';

function DictionaryField({ script, resource, spec, value, name, path, opts,
  onPropUpdate, renderAny }) {
  const AnyField = renderAny;
  const items = _.map(value, (val, key) => (
    // eslint-disable-next-line react/no-array-index-key
    <div key={key}>
      <button
        onClick={() => onPropUpdate(`${path}[${key}]`, null)}
        className="btn btn-xs btn-outline-secondary">
        <i className="fa fa-minus" />
      </button>
      &nbsp;
      <AnyField
        script={script}
        resource={resource}
        onPropUpdate={onPropUpdate}
        spec={spec.keys}
        value={key}
        name={`${name} Key`}
        path={'INVALID'}
        opts={{ editable: false }} />
      :&nbsp;
      <AnyField
        script={script}
        resource={resource}
        onPropUpdate={onPropUpdate}
        spec={spec.values}
        value={val}
        name={`${name} Value`}
        path={`${path}[${key}]`} />
      <BaseClear
        spec={spec}
        value={val}
        path={`${path}[${key}]`}
        onPropUpdate={onPropUpdate} />
    </div>
  ));
  const newItem = newItemsForSpecType[spec.values.type];
  const newItemBtn = (
    <div>
      <button className="btn btn-xs btn-outline-secondary disabled">
        <i className="fa fa-plus" />
      </button>
      &nbsp;
      <AnyField
        script={script}
        resource={resource}
        onPropUpdate={onPropUpdate}
        spec={spec.keys}
        value={'New item'}
        name={`${name} New Key`}
        path={'INVALID'}
        opts={{
          onConfirm: val => onPropUpdate(`${path}[${val}]`, newItem)
        }} />
    </div>
  );
  return (
    <div>
      {items}
      {newItemBtn}
    </div>
  );
}


DictionaryField.defaultProps = { opts: {}, value: {} };
DictionaryField.propTypes = {
  script: PropTypes.object.isRequired,
  resource: PropTypes.object.isRequired,
  onPropUpdate: PropTypes.func.isRequired,
  spec: PropTypes.object.isRequired,
  name: PropTypes.string.isRequired,
  path: PropTypes.string.isRequired,
  opts: PropTypes.object,
  value: PropTypes.object,
  renderAny: PropTypes.func.isRequired
};

export default DictionaryField;
