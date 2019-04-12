import _ from 'lodash';
import React, { Component } from 'react';

import { ModulesRegistry, TextUtil } from 'fptcore';

import ResourceBadge from '../partials/ResourceBadge';
import { labelForSpec } from '../utils/spec-utils';

function renderActions(module, actionNames) {
  return _.map(actionNames, actionName => (
    <div key={actionName} className="constrain-text pl-2">
      <a href={`#${actionName}`}>{actionName}</a>
    </div>
  ));
}

function renderEvents(module, eventTypes) {
  return _.map(eventTypes, eventType => (
    <div key={eventType} className="constrain-text pl-2">
      <a href={`#${eventType}`}>{eventType}</a>
    </div>
  ));
}

function renderResourceLink(resourceType, moduleResource) {
  const resourceClass = moduleResource.resource || moduleResource.subresource;
  const resourceIconName = resourceClass && resourceClass.icon;
  const resourceIcon = resourceIconName ? (
    <i className={`fa fa-${resourceIconName} mr-1`} />
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
  // Variategated resources don't display well.
  const actionNames = Object.keys(moduleResource.actions || {});
  const eventTypes = Object.keys(moduleResource.events || {});
  const resourceClass = (actionNames.length > 0 || eventTypes.length > 0) ?
    'mb-2' : '';
  return (
    <div key={resourceType} className={resourceClass}>
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
    <div key={moduleName} className="mb-2">
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

function labelForSubresource(resourceType) {
  return (
    <a href={`#s_${resourceType}`}>
      <ResourceBadge resourceType={resourceType} className="mb-1" />
    </a>
  );
}

function labelForSpecType(spec, key) {
  // HACK
  if (_.startsWith(key, 'actions')) {
    return 'Action';
  }
  // HACK
  if (_.startsWith(key, 'events')) {
    return 'Event';
  }
  if (!spec.type) {
    return 'unknown';
  }
  if (spec.type === 'subresource') {
    return labelForSubresource(spec.name);
  }
  // HACK: Only for panel at the moment
  if (spec.type === 'variegated') {
    return Object.keys(spec.classes)
      .map(k => (
        <span key={k} className="mr-1">
          {labelForSubresource(`${k}_panel`)}
        </span>
      ));
  }
  if (spec.type === 'list') {
    return <span>List</span>;
  }
  if (spec.type === 'dictionary') {
    return <span>Dictionary</span>;
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

function renderResourceFieldItem(key, spec, prefix) {
  if (_.get(spec, 'display.hidden')) {
    return null;
  }
  const specStyle = spec.required ? { fontWeight: 'bold' } : {};
  return (
    <tr key={`${prefix}-${key}`}>
      <td
        className="constrain-text"
        style={specStyle}>
        {prefix}{labelForSpec(spec, key)}
      </td>
      <td>{labelForSpecType(spec, key)}</td>
      <td>{spec.help}</td>
    </tr>
  );
}

function renderResourceField(key, spec, prefix) {
  if (_.get(spec, 'display.hidden')) {
    return null;
  }
  const prefixes = (
    <span>{prefix}<span className="faint mr-1">&bull;</span></span>
  );
  if (spec.type === 'list') {
    return [
      renderResourceFieldItem(key, spec, prefix),
      renderResourceField('item', spec.items, prefixes)
    ];
  }
  if (spec.type === 'dictionary') {
    return [
      renderResourceFieldItem(key, spec, prefix),
      renderResourceField('key', spec.keys, prefixes),
      renderResourceField('value', spec.values, prefixes)
    ];
  }
  if (spec.type === 'object') {
    return [renderResourceFieldItem(key, spec, prefix)]
      .concat(...Object.keys(spec.properties).map(k => (
        renderResourceField(k, spec.properties[k], prefixes)
      )));
  }
  return renderResourceFieldItem(key, spec, prefix);
}

const HIDE_PROPERTIES = ['name', 'title'];

function renderFields(properties) {
  const keys = Object
    .keys(properties)
    .filter(key => HIDE_PROPERTIES.indexOf(key) === -1);

  if (!keys.length) {
    return null;
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
      <p>{resource.help}</p>
      {renderFields(resource.properties)}
    </div>
  );
}

function renderAction(actionName, actionSpec) {
  return (
    <div key={actionName}>
      <h4 id={actionName}>
        Action: <strong>{actionName}</strong>
      </h4>
      <p>{actionSpec.help}</p>
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
      <p>{eventSpec.help}</p>
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
