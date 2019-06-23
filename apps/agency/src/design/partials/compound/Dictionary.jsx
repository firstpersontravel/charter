import _ from 'lodash';
import React from 'react';
import PropTypes from 'prop-types';

import BaseClear from '../fields/BaseClear';
import { newItemsForSpecType } from './utils';

function DictionaryField({ script, resource, spec, value, name, path, opts,
  onPropUpdate, onArrayUpdate, renderAny }) {
  const AnyField = renderAny;
  const items = _.map(value, (val, key) => (
    // eslint-disable-next-line react/no-array-index-key
    <div key={key}>
      <button
        onClick={() => this.onPropUpdate(`${path}[${key}]`, null)}
        className="btn btn-xs btn-outline-secondary">
        <i className="fa fa-minus" />
      </button>
      &nbsp;
      <AnyField
        script={this.script}
        resource={this.resource}
        onPropUpdate={this.onPropUpdate}
        onArrayUpdate={this.onArrayUpdate}
        spec={spec.keys}
        value={key}
        name={`${name} Key`}
        path={'INVALID'}
        opts={{ editable: false }} />
      :&nbsp;
      <AnyField
        script={this.script}
        resource={this.resource}
        onPropUpdate={this.onPropUpdate}
        onArrayUpdate={this.onArrayUpdate}
        spec={spec.values}
        value={val}
        name={`${name} Value`}
        path={`${path}[${key}]`} />
      <BaseClear
        spec={spec}
        value={val}
        path={`${path}[${key}]`}
        onPropUpdate={this.onPropUpdate} />
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
        script={this.script}
        resource={this.resource}
        onPropUpdate={this.onPropUpdate}
        onArrayUpdate={this.onArrayUpdate}
        spec={spec.keys}
        value={'New item'}
        name={`${name} New Key`}
        path={'INVALID'}
        opts={{
          onConfirm: val => this.onPropUpdate(`${path}[${val}]`, newItem)
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
  onArrayUpdate: PropTypes.func.isRequired,
  spec: PropTypes.object.isRequired,
  name: PropTypes.string.isRequired,
  path: PropTypes.string.isRequired,
  opts: PropTypes.object,
  value: PropTypes.object,
  renderAny: PropTypes.func.isRequired
};

export default DictionaryField;
