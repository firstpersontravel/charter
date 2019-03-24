import _ from 'lodash';
import React, { Component } from 'react';

import { ModulesRegistry, TextUtil } from 'fptcore';

import ResourceBadge, { RESOURCE_ICONS } from '../partials/ResourceBadge';
import { labelForSpec } from '../utils/spec-utils';

function renderActions(module, actionNames) {
  const subitemStyle = { paddingLeft: '0.5em' };
  return _.map(actionNames, actionName => (
    <div key={actionName} className="constrain-text" style={subitemStyle}>
      <a href={`#${actionName}`}>
        <i className="fa fa-mail-forward" /> {actionName}
      </a>
    </div>
  ));
}

function renderEvents(module, eventTypes) {
  const subitemStyle = { paddingLeft: '0.5em' };
  return _.map(eventTypes, eventType => (
    <div key={eventType} className="constrain-text" style={subitemStyle}>
      <a href={`#${eventType}`}>
        <i className="fa fa-bolt" /> {eventType}
      </a>
    </div>
  ));
}

function renderResourceLink(resourceType, moduleResource) {
  const resourceIcon = RESOURCE_ICONS[resourceType] ? (
    <i style={{ marginRight: '0.25em' }} className={`fa fa-${RESOURCE_ICONS[resourceType]}`} />
  ) : null;

  const resourceLabel = (
    <span>
      {resourceIcon}{TextUtil.titleForKey(resourceType)}
    </span>
  );

  if (moduleResource.resource) {
    return (
      <a href={`#r_${resourceType}`}>{resourceLabel}</a>
    );
  }
  if (moduleResource.subresource) {
    return (
      <a href={`#s_${resourceType}`}>{resourceLabel}</a>
    );
  }
  return resourceLabel;
}

function renderSidebarResource(resourceType, moduleResource) {
  if (resourceType === 'panel') {
    return null;
  }
  const actionNames = Object.keys(moduleResource.actions || {});
  const eventTypes = Object.keys(moduleResource.events || {});
  const resourceStyle = (actionNames.length > 0 || eventTypes.length > 0) ?
    { marginBottom: '0.5em' } :
    {};
  return (
    <div key={resourceType} style={resourceStyle}>
      <div className="constrain-text">
        {renderResourceLink(resourceType, moduleResource)}
      </div>
      {renderActions(module, actionNames)}
      {renderEvents(module, eventTypes)}
    </div>
  );
}

function renderSidebarModule(moduleName, module) {
  const renderedResources = Object.keys(module.resources).map(resourceType => (
    renderSidebarResource(resourceType, module.resources[resourceType])
  ));

  return (
    <div key={moduleName} style={{ marginBottom: '1em' }}>
      <div className="constrain-text bold" style={{ borderBottom: '1px solid gray' }}>
        <a href={`#${moduleName}`}>
          {TextUtil.titleForKey(moduleName)}
        </a>
      </div>
      {renderedResources}
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

const HIDE_PROPERTIES = ['name', 'title'];

function renderFields(properties) {
  const keys = Object
    .keys(properties)
    .filter(key => HIDE_PROPERTIES.indexOf(key) === -1);

  if (!keys.length) {
    return null;
  }

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

function renderResourceSimple(resourceType, moduleResource) {
  const resource = moduleResource.resource || moduleResource.subresource;
  if (!resource) {
    return null;
  }
  const isPrimaryResource = !!moduleResource.resource;
  const resourceTypeTitle = isPrimaryResource ?
    'Resource' :
    'Embedded resource';
  return (
    <div key={resourceType}>
      <h3 id={`${isPrimaryResource ? 'r' : 's'}_${resourceType}`}>
        {resourceTypeTitle}: <ResourceBadge resourceType={resourceType} />
      </h3>
      <p>{_.get(resource, 'help.summary')}</p>
      {renderFields(resource.properties)}
    </div>
  );
}

function renderAction(actionName, actionSpec) {
  return (
    <div key={actionName}>
      <h4 id={actionName}>
        Action: <i className="fa fa-mail-forward" /> <strong>{actionName}</strong>
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
        Event: <strong><i className="fa fa-bolt" /> {eventType}</strong>
      </h4>
      <p>{_.get(eventSpec, 'help.summary')}</p>
      {renderFields(eventSpec.specParams)}
    </div>
  );
}

function renderResource(resourceType, moduleResource) {
  const renderedResource = renderResourceSimple(resourceType, moduleResource);
  const renderedActions = Object
    .keys(moduleResource.actions || {})
    .map(actionName => (
      renderAction(actionName, moduleResource.actions[actionName])
    ));
  const renderedEvents = Object
    .keys(moduleResource.events || {})
    .map(eventName => (
      renderEvent(eventName, moduleResource.events[eventName])
    ));
  return (
    <div key={resourceType}>
      {renderedResource}
      {renderedActions}
      {renderedEvents}
    </div>
  );
}

function renderModule(moduleName, module) {
  const renderedResources = Object.keys(module.resources).map(resourceType => (
    renderResource(resourceType, module.resources[resourceType])
  ));
  return (
    <div style={{ borderBottom: '2px dashed #aaa' }} key={moduleName}>
      <h2 id={moduleName}>
        Module: <strong>{TextUtil.titleForKey(moduleName)}</strong>
      </h2>
      <p>The {moduleName} module gathers relevant resources, events and actions.</p>
      {renderedResources}
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
