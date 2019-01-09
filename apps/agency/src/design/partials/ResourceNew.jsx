import _ from 'lodash';
import React, { Component } from 'react';
import PropTypes from 'prop-types';

import { ResourcesRegistry, TextUtil } from 'fptcore';

import { renderLink } from '../../partials/Param';

const empty = <em className="faint">Empty</em>;

let renderFieldValue;

const renderers = {
  string: (script, spec, value) => `"${value}"`,
  raw: (script, spec, value) => value,
  boolean: (script, spec, value) => (value ? 'Yes' : 'No'),
  reference: (script, spec, value) => (
    value ? renderLink(script, spec.collection, value) : empty
  ),
  coords: (script, spec, value) => (
    `${value[0].toFixed(3)}, ${value[1].toFixed(3)}`
  ),
  list: (script, spec, value) => {
    if (value.length === 0) {
      return empty;
    }
    return (
      <ul>
        {value.map((item, i) => (
          // eslint-disable-next-line react/no-array-index-key
          <li key={i}>
            {renderFieldValue(script, spec.items, item)}
          </li>
        ))}
      </ul>
    );
  },
  dictionary: (script, spec, value) => {
    if (Object.keys(value).length === 0) {
      return empty;
    }
    return (
      <ul>
        {Object.keys(value).map(key => (
          // eslint-disable-next-line react/no-array-index-key
          <li key={key}>
            {renderFieldValue(script, spec.keys, key)}:&nbsp;
            {renderFieldValue(script, spec.values, value[key])}
          </li>
        ))}
      </ul>
    );
  },
  object: (script, spec, value) => {
    if (Object.keys(value).length === 0) {
      return empty;
    }
    return (
      <div>
        {Object.keys(spec.properties).map((key) => {
          if (_.isUndefined(value[key]) && _.isUndefined(spec.properties[key].default)) {
            return null;
          }
          return (
            // eslint-disable-next-line react/no-array-index-key
            <div key={key}>
              <strong>{key}:</strong>&nbsp;
              {renderFieldValue(script, spec.properties[key], value[key])}
            </div>
          );
        })}
      </div>
    );
  },
  subresource: (script, spec, value) => {
    const properties = Object.keys(spec.class.properties);
    if (properties.length === 1 && properties[0] === 'self') {
      return renderFieldValue(script, spec.class.properties.self, value);
    }
    return renderers.object(script, spec.class, value);
  },
  variegated: (script, spec, value) => {
    const variety = _.isFunction(spec.key) ? spec.key(value) : value[spec.key];
    const commonClass = spec.common;
    const varietyClass = spec.classes[variety];
    const mergedClass = _.merge({}, commonClass, varietyClass);
    return renderers.subresource(script, { class: mergedClass }, value);
  }
};

// Aliases
renderers.name = renderers.string;
renderers.ifClause = renderers.string;
renderers.enum = renderers.string;
renderers.number = renderers.raw;
renderers.timeShorthand = renderers.raw;

renderFieldValue = function (script, spec, value) {
  const fieldType = spec.type;
  const fieldRenderer = renderers[fieldType];
  if (!fieldRenderer) {
    return `??? (${fieldType})`;
  }
  if (_.isUndefined(value)) {
    if (!_.isUndefined(spec.default)) {
      return (
        <em className="faint">
          {fieldRenderer(script, spec, spec.default)}
          &nbsp;by default
        </em>
      );
    }
    return empty;
  }
  return fieldRenderer(script, spec, value);
};

export default class ResourceNew extends Component {

  getResourceClass() {
    const resourceType = TextUtil.singularize(this.props.collectionName);
    return ResourcesRegistry[resourceType];
  }

  getFieldNames() {
    return Object.keys(this.getResourceClass().properties);
  }

  renderField(fieldName) {
    const script = this.props.script;
    const resourceClass = this.getResourceClass();
    const spec = resourceClass.properties[fieldName];
    const value = this.props.resource[fieldName];
    if (_.isUndefined(value) && _.isUndefined(spec.default)) {
      return null;
    }
    const fieldRendered = renderFieldValue(script, spec, value);
    return (
      <div key={fieldName}>
        <strong>{fieldName}</strong>:&nbsp;
        {fieldRendered}
      </div>
    );
  }

  renderFields() {
    return this.getFieldNames().map(fieldName => (
      this.renderField(fieldName)
    ));
  }

  render() {
    return (
      <div>
        {this.renderFields()}
      </div>
    );
  }
}

ResourceNew.propTypes = {
  script: PropTypes.object.isRequired,
  collectionName: PropTypes.string.isRequired,
  resource: PropTypes.object.isRequired
};
