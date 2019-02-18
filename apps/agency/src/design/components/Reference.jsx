import _ from 'lodash';
import React, { Component } from 'react';

import { ModulesRegistry, TextUtil } from 'fptcore';

import ResourceBadge from '../partials/ResourceBadge';
import { labelForSpec } from '../utils/spec-utils';

function renderSidebarModule(moduleName, module) {
  return (
    <div key={moduleName}>
      <div>
        <a href={`#${moduleName}`}>{TextUtil.titleForKey(moduleName)}</a>
      </div>
    </div>
  );
}

function renderSidebar() {
  const renderedModules = Object.keys(ModulesRegistry).map(moduleName => (
    renderSidebarModule(moduleName, ModulesRegistry[moduleName])
  ));
  return (
    <div className="col-sm-2 script-editor-full-height d-none d-sm-block">
      {renderedModules}
    </div>
  );
}

function labelForSpecType(spec, key) {
  // HACK
  if (_.endsWith(key, 'panels')) {
    return 'List: Panel';
  }
  // HACK
  if (key === 'actions') {
    return 'List: Action';
  }
  // HACK
  if (key === 'events') {
    return 'List: Event';
  }
  if (!spec.type) {
    return 'unknown';
  }
  if (spec.type === 'subresource') {
    return labelForSpecType(spec.class);
  }
  if (spec.type === 'variegated') {
    return Object.values(spec.classes)
      .map(cls => (
        <span style={{ marginRight: '0.25em' }}>
          {labelForSpecType(cls)}
        </span>
      ));
  }
  if (spec.type === 'list') {
    return (
      <span>List: {labelForSpecType(spec.items)}</span>
    );
  }
  if (spec.type === 'dictionary') {
    return (
      <span>Dictionary: {labelForSpecType(spec.keys)} to {labelForSpecType(spec.values)}</span>
    );
  }
  if (spec.type === 'reference') {
    const resourceType = TextUtil.singularize(spec.collection);
    return (
      <a className="text-dark" href={`#r_${resourceType}`}>
        <ResourceBadge resourceType={resourceType} />
      </a>
    );
  }
  if (spec.type === 'ifClause') {
    return 'If Statement';
  }
  if (spec.type === 'enum') {
    return spec.options.map(s => `"${s}"`).join(' | ');
  }
  return TextUtil.titleForKey(spec.type);
}

function renderResourceField(key, spec) {
  const specStyle = spec.required ? { fontWeight: 'bold' } : {};
  return (
    <tr key={key}>
      <td style={specStyle}>{labelForSpec(spec, key)}</td>
      <td>{labelForSpecType(spec, key)}</td>
      <td />
    </tr>
  );
}

function renderFields(properties) {
  const keys = Object.keys(properties);
  if (keys.length === 1 && keys[0] === 'self') {
    return renderFields(properties.self);
  }
  const fields = keys.map(key => (
    renderResourceField(key, properties[key])
  ));
  return (
    <table className="table table-sm table-bordered table-striped">
      <thead>
        <tr>
          <th>Field</th>
          <th>Type</th>
          <th>Description</th>
        </tr>
      </thead>
      <tbody>
        {fields}
      </tbody>
    </table>
  );
}

function renderSubresource(resourceType, resourceSpec) {
  // HACK
  if (resourceType === 'panel') {
    return null;
  }
  return (
    <div key={resourceType}>
      <h3 id={`s_${resourceType}`}>
        Embedded resource: {TextUtil.titleForKey(resourceType)}
      </h3>
      <p>{_.get(resourceSpec, 'help.summary')}</p>
      {renderFields(resourceSpec.properties)}
    </div>
  );
}

function renderResource(resourceType, resourceSpec) {
  return (
    <div key={resourceType}>
      <h3 id={`r_${resourceType}`}>
        Resource: <ResourceBadge resourceType={resourceType} />
      </h3>
      <p>{_.get(resourceSpec, 'help.summary')}</p>
      {renderFields(resourceSpec.properties)}
    </div>
  );
}

function renderAction(actionName, actionSpec) {
  return (
    <div key={actionName}>
      <h4 id={actionName}>
        Action: <strong>{actionName}</strong>
      </h4>
      <p>{_.get(actionSpec, 'help.summary')}</p>
      {renderFields(actionSpec.params)}
    </div>
  );
}

function renderEvent(eventType, eventSpec) {
  return (
    <div key={eventType}>
      <h4 id={eventType}>
        Event: <strong>{eventType}</strong>
      </h4>
      <p>{_.get(eventSpec, 'help.summary')}</p>
      {renderFields(eventSpec.specParams)}
    </div>
  );
}

function renderModule(moduleName, module) {
  const renderedResources = Object.keys(module.resources).map(resourceType => (
    renderResource(resourceType, module.resources[resourceType])
  ));
  const renderedSubresources = Object.keys(module.subresources)
    .map(resourceType => (
      renderSubresource(resourceType, module.subresources[resourceType])
    ));
  const renderedActions = Object.keys(module.actions).map(actionName => (
    renderAction(actionName, module.actions[actionName])
  ));
  const renderedEvents = Object.keys(module.events).map(eventName => (
    renderEvent(eventName, module.events[eventName])
  ));
  return (
    <div style={{ borderBottom: '2px dashed #aaa' }} key={moduleName}>
      <h2 id={moduleName}>
        Module: <strong>{TextUtil.titleForKey(moduleName)}</strong>
      </h2>
      <p>The {moduleName} module gathers relevant resources, events and actions.</p>
      {renderedResources}
      {renderedSubresources}
      {renderedActions}
      {renderedEvents}
    </div>
  );
}


function renderMain() {
  const renderedModules = Object.keys(ModulesRegistry).map(moduleName => (
    renderModule(moduleName, ModulesRegistry[moduleName])
  ));
  return (
    <div className="col-sm-10 script-editor-full-height">
      {renderedModules}
    </div>
  );
}

// eslint-disable-next-line react/prefer-stateless-function
export default class Reference extends Component {
  render() {
    return (
      <div className="row">
        {renderSidebar()}
        {renderMain()}
      </div>
    );
  }
}

Reference.propTypes = {};