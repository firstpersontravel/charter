import _ from 'lodash';
import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router';

import { ActionPhraseCore, ActionsRegistry, ResourcesRegistry, TextUtil } from 'fptcore';

import { titleForResource } from '../utils/text-utils';
import { linkForResource } from '../utils/section-utils';
// import PopoverControl from '../../partials/PopoverControl';

// Hide title, field, and name
const HIDE_FIELD_NAMES = ['name', 'title', 'scene'];

const empty = <em className="faint">Empty</em>;

let renderFieldValue;

function ifClauseToString(ifClause) {
  if (_.isString(ifClause)) {
    return ifClause;
  }
  if (_.isArray(ifClause)) {
    return `(${_.map(ifClause, ifClauseToString).join(' and ')})`;
  }
  if (_.isPlainObject(ifClause) && ifClause.or) {
    return `(${_.map(ifClause.or, ifClauseToString).join(' or ')})`;
  }
  return '';
}

const renderers = {
  string: (script, spec, value) => `"${value}"`,
  raw: (script, spec, value) => value,
  boolean: (script, spec, value) => (value ? 'Yes' : 'No'),
  simpleValue: (script, spec, value) => {
    if (_.isNumber(value)) {
      return renderers.raw(script, spec, value);
    }
    if (_.isBoolean(value)) {
      return renderers.boolean(script, spec, value);
    }
    return renderers.string(script, spec, value);
  },
  reference: (script, spec, value) => {
    if (!value) {
      return empty;
    }
    if (value === 'null') {
      return 'None';
    }
    const url = linkForResource(script, spec.collection, value);
    const collection = script.content[spec.collection];
    const resource = _.find(collection, { name: value });
    const title = titleForResource(spec.collection, resource);
    return (
      <Link to={url}>{title}</Link>
    );
  },
  ifClause: (script, spec, value) => (
    ifClauseToString(value)
  ),
  coords: (script, spec, value) => (
    `${value[0].toFixed(3)}, ${value[1].toFixed(3)}`
  ),
  actionPhrase: (script, spec, value) => {
    const action = ActionPhraseCore.parseActionPhrase(value);
    const actionClass = ActionsRegistry[action.name];
    const parts = [{
      name: 'name',
      rendered: action.name
    }];
    _.each(actionClass.phraseForm, (paramName) => {
      const paramSpec = actionClass.params[paramName];
      const paramValue = action.params[paramName];
      parts.push({
        name: paramName,
        rendered: renderFieldValue(script, paramSpec, paramValue)
      });
    });
    return parts.map(part => (
      <span key={part.name}>{part.rendered}&nbsp;</span>
    ));
  },
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
          const keySpec = spec.properties[key];
          if (_.isUndefined(value[key]) && _.isUndefined(keySpec.default)) {
            return null;
          }
          return (
            // eslint-disable-next-line react/no-array-index-key
            <div key={key}>
              <strong>{_.upperFirst(key)}:</strong>&nbsp;
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
renderers.name = renderers.raw;
renderers.duration = renderers.raw;
renderers.lookupable = renderers.raw;
renderers.nestedAttribute = renderers.raw;
renderers.simpleAttribute = renderers.raw;
renderers.enum = renderers.raw;
renderers.media = renderers.raw;
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

export default class ResourceView extends Component {

  getResourceClass() {
    const resourceType = TextUtil.singularize(this.props.collectionName);
    return ResourcesRegistry[resourceType];
  }

  getFieldNames() {
    return _.without(
      Object.keys(this.getResourceClass().properties),
      ...HIDE_FIELD_NAMES);
  }

  renderFields() {
    const script = this.props.script;
    const fieldNames = this.getFieldNames();
    if (!fieldNames.length) {
      return (
        <div className="alert alert-info">
          This resource has no customizable fields.
        </div>
      );
    }
    const resourceClass = this.getResourceClass();
    const whitelistedParams = {
      properties: _.pick(resourceClass.properties, ...fieldNames)
    };
    return renderers.object(script, whitelistedParams, this.props.resource);
  }

  render() {
    return (
      <div>
        {this.renderFields()}
      </div>
    );
  }
}

ResourceView.propTypes = {
  script: PropTypes.object.isRequired,
  collectionName: PropTypes.string.isRequired,
  resource: PropTypes.object.isRequired
};
