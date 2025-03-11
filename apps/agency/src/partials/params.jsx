import _ from 'lodash';
import React from 'react';
import { Link } from 'react-router-dom';

import { coreRegistry, coreWalker } from 'fptcore';

import { labelForSpec } from '../design/utils/spec-utils';
import { titleForResource } from '../design/utils/text-utils';
import { urlForResource } from '../design/utils/section-utils';
import { fullMediaUrl } from '../operate/utils';

const maxParamLength = 100;
const maxMessageLength = 100;

function truncateMsg(msg, maxLength) {
  return msg.length > maxLength ? `${msg.slice(0, maxLength)}...` : msg;
}

export function renderParam(script, key, spec, param) {
  if (spec.type === 'reference') {
    const collectionName = spec.collection;
    const collection = script.content[collectionName] || [];
    const resource = _.find(collection, { name: param });
    if (resource) {
      return (
        <Link to={urlForResource(script, collectionName, resource.name)}>
          {titleForResource(script.content, collectionName, resource)}
        </Link>
      );
    }
  }
  if (spec.type === 'componentReference') {
    const { componentType } = spec;
    const variantClass = coreRegistry[componentType][spec.componentVariant];
    const component = coreWalker.getComponentById(script.content,
      spec.componentType, param);
    if (variantClass.getTitle) {
      return variantClass.getTitle(component, script.content);
    }
  }
  if (spec.type === 'media') {
    return '<media>';
  }
  if (typeof param === 'string') {
    return truncateMsg(param, maxParamLength);
  }
  return param;
}

export function renderParams(script, spec, params) {
  return Object
    .entries(params)
    .filter(([key, val]) => spec[key])
    .map(([key, val]) => (
      <div key={key}>
        <span className="mr-1" style={{ fontVariant: 'small-caps' }}>
          {labelForSpec(spec[key], key)}
          :
        </span>
        {renderParam(script, key, spec[key], val)}
      </div>
    ));
}

export function renderMessageContent(script, fields) {
  const role = (script.content.roles || [])
    .find(r => r.name === fields.fromRoleName);
  const roleTitle = role ? role.title : fields.fromRoleName;
  if (fields.medium === 'image') {
    const url = fullMediaUrl(script.org, script.experience, fields.content);
    return (
      <span>
        {roleTitle}
        :&nbsp;
        <img alt="Message" src={url} className="img-fluid" />
      </span>
    );
  }
  return `${roleTitle}: "${truncateMsg(fields.content, maxMessageLength)}"`;
}
