const fs = require('fs');
const path = require('path');
const program = require('commander');

const TextUtil = require('../src/utils/text');
const registry = require('../src/core-registry');
const Validations = require('../src/utils/validations');

program
  .option('--out-path', 'output folder')
  .parse(process.argv);

const docsUrlPrefix = '/docs/reference';

const AGENCY_PATH = path.resolve(path.dirname(path.dirname(__dirname)));
const DEFAULT_DOCS_PATH = path.join(path.dirname(AGENCY_PATH),
  'docs/docs/reference');

const pageSettings = {
  resources: { title: 'Resources', fields: 'properties' },
  actions: { title: 'Actions', fields: 'params' },
  events: { title: 'Events', fields: 'specParams' },
  panels: { title: 'Panels', fields: 'properties' },
  conditions: { title: 'Conditions', fields: 'properties' },
  fieldtypes: { title: 'Field types', fields: null }
};

const intros = {
  resources: 'Resources are the primary objects in your script.',
  actions: 'Every action makes a change in the state of your running trip.',
  events: 'Events occur over the course of your trip operation. When a trigger is associated with an event, that trigger will activate whenever a matching event occurs.',
  panels: 'A panel is the core component for user experience in Charter. Each page is comprised of as many panels as you like.',
  conditions: 'A condition is how you create logic and branching in your experience.',
  fieldtypes: 'Fields are the underlying data elements of each object in your script. Each is validated in a different way.'
};

const HIDE_FIELDS = ['name', 'title'];

function renderTypeTitle(spec) {
  if (spec.type === 'list') {
    if (spec.items.type === 'object') {
      return 'List';
    }
    return `[${renderTypeTitle(spec.items)}]`;
  }
  if (spec.type === 'dictionary') {
    return `${renderTypeTitle(spec.keys)} to ${renderTypeTitle(spec.values)}`;
  }
  if (spec.type === 'reference') {
    const resourceType = TextUtil.singularize(spec.collection);
    const resourceClass = registry.resources[resourceType];
    const resourceTitle = TextUtil.titleForSpec(resourceClass, resourceType);
    const anchor = resourceType.replace(/_/g, '-');
    return `[${resourceTitle}](${docsUrlPrefix}/resources#${anchor})`;
  }
  if (spec.type === 'component') {
    const componentType = TextUtil.singularize(spec.component);
    const componentTitle = TextUtil.titleForKey(componentType);
    return `[${componentTitle}](${docsUrlPrefix}/${spec.component})`;
  }
  if (spec.type === 'componentReference') {
    const componentType = TextUtil.singularize(spec.componentType);
    const title = TextUtil.titleForKey(componentType).toLowerCase();
    const variantClass = registry[spec.componentType][spec.componentVariant];
    const variantTitle = TextUtil.titleForSpec(variantClass,
      spec.componentVariant);
    const anchor = spec.componentVariant.replace(/_/g, '-');
    return `[${variantTitle} ${title}](${docsUrlPrefix}/${spec.componentType}#${anchor})`;
  }
  if (spec.type === 'enum') {
    const opts = spec.options.map(s => `\`${s}\``);
    const lastOpt = opts.pop();
    return opts.length ? `${opts.join(', ')} or ${lastOpt}` : lastOpt;
  }
  if (Validations[spec.type]) {
    const validation = Validations[spec.type];
    const specTitle = validation.title || TextUtil.titleForKey(spec.type);
    const specAnchor = specTitle.toLowerCase().replace(/[_\s]/g, '-');
    return `[${specTitle}](${docsUrlPrefix}/fieldtypes#${specAnchor})`;
  }
  return TextUtil.titleForKey(spec.type);
}

function renderItem(key, spec) {
  const typeTitle = renderTypeTitle(spec);
  const fieldName = spec.required ? `**${key}**` : key;
  return `| ${fieldName} | ${typeTitle} | ${spec.help || ''} |`;
}

const sep = ' → ';

const COMPLEX_SPEC_TYPES = ['list', 'dictionary', 'object'];

function isSimple(spec) {
  return !COMPLEX_SPEC_TYPES.includes(spec.type);
}

function renderField(sectionName, entryName, key, spec) {
  if (spec.display && spec.display.hidden) {
    return '';
  }  
  if (!spec.help) {
    console.log(` ! Help not found for ${sectionName}: ${entryName}: ${key}`);
  }
  if (spec.type === 'list') {
    if (isSimple(spec.items)) {
      return renderItem(key, spec);
    }
    return [
      renderItem(key, spec),
      renderField(sectionName, entryName, key, spec.items)
    ].join('\n');
  }
  if (spec.type === 'dictionary') {
    if (isSimple(spec.keys) && isSimple(spec.values)) {
      return renderItem(key, spec);
    }
    return [
      renderItem(key, spec),
      renderField(sectionName, entryName, `${key}${sep}Keys`, spec.keys),
      renderField(sectionName, entryName, `${key}${sep}Values`, spec.values)
    ].join('\n');
  }
  if (spec.type === 'object') {
    const props = Object.keys(spec.properties)
      .map(k => renderField(sectionName, entryName,
        `${key}${sep}${TextUtil.titleForSpec(spec.properties[k], k)}`,
        spec.properties[k]))
      .filter(Boolean);
    return props.join('\n');
  }
  return renderItem(key, spec);
}

function renderFields(sectionName, entryName, fields) {
  if (!fields) {
    return '';
  }

  const keys = Object
    .keys(fields)
    .filter(key => !HIDE_FIELDS.includes(key));

  const renderedFields = keys
    .map(key => renderField(sectionName, entryName,
      TextUtil.titleForSpec(fields[key], key), fields[key]))
    .filter(Boolean)
    .join('\n');

  if (renderedFields === '') {
    return '';
  }

  return `
| Field | Type | Description |
| - | - | - |
${renderedFields}`;
}

function doesParamsReferenceResource(params, collectionName) {
  for (const key of Object.keys(params)) {
    // console.log('key', key, params[key], collectionName);
    if (params[key].type === 'reference' &&
        params[key].collection === collectionName) {
      return key;
    }
  }
  return null;
}

function renderEvents(resourceType) {
  const collectionName = TextUtil.pluralize(resourceType);
  const resourceSpec = registry.resources[resourceType];
  const resourceTitle = resourceSpec.title ||
    TextUtil.titleForKey(resourceType);
  const eventsRendered = Object.keys(registry.events)
    .filter((eventType) => {
      const eventParams = registry.events[eventType].specParams;
      return doesParamsReferenceResource(eventParams, collectionName);
    })
    .map((eventType) => {
      const eventClass = registry.events[eventType];
      const eventParams = registry.events[eventType].specParams;
      const key = doesParamsReferenceResource(eventParams, collectionName);
      const keySpec = eventParams[key];
      const keyTitle = TextUtil.titleForSpec(keySpec, key);
      const eventTitle = TextUtil.titleForSpec(eventClass, eventType);
      return `* The \`${keyTitle}\` field of the [${eventTitle}](/docs/reference/events#${eventType}) event is a ${resourceTitle}.`;
    });
  if (!eventsRendered.length) {
    return '';
  }
  return eventsRendered.join('\n');
}

function renderActions(resourceType) {
  const collectionName = TextUtil.pluralize(resourceType);
  const resourceSpec = registry.resources[resourceType];
  const resourceTitle = TextUtil.titleForSpec(resourceSpec, resourceType);
  const actionsRendered = Object.keys(registry.actions)
    .filter((actionName) => {
      // console.log('filter', actionName);
      const actionParams = registry.actions[actionName].params;
      return doesParamsReferenceResource(actionParams, collectionName);
    })
    .map((actionName) => {
      const actionClass = registry.actions[actionName];
      const actionParams = registry.actions[actionName].params;
      const key = doesParamsReferenceResource(actionParams, collectionName);
      const keySpec = actionParams[key];
      const keyTitle = TextUtil.titleForSpec(keySpec, key);
      const actionTitle = TextUtil.titleForSpec(actionClass, actionName);
      return `* The \`${keyTitle}\` field of the [${actionTitle}](/docs/reference/actions#${actionName}) action is a ${resourceTitle}.`;
    });
  if (!actionsRendered.length) {
    return '';
  }
  return actionsRendered.join('\n');
}

function renderReferences(sectionName, entryName) {
  if (sectionName !== 'resources') {
    return '';
  }
  return `
${renderActions(entryName)}
${renderEvents(entryName)}`;
}

function renderEntry(sectionName, entryName, entry) {
  if (!entry.help) {
    throw new Error(`Help not found for ${sectionName}: ${entryName}.`);
  }

  const fieldsProp = pageSettings[sectionName].fields;
  const fields = entry[fieldsProp];
  const title = TextUtil.titleForSpec(entry, entryName);
  return `## ${title}

${entry.help}

${renderFields(sectionName, entryName, fields)}
${renderReferences(sectionName, entryName)}
\n\n`;
}

function renderPage(sectionName, contents) {
  const title = pageSettings[sectionName].title;
  const intro = intros[sectionName];
  let page = `---
id: ${sectionName}
title: ${title}
sidebar_label: ${title}
---

${intro}
`;
  const sortedEntries = Object
    .keys(contents)
    .sort((a, b) => {
      const aEntry = contents[a];
      const bEntry = contents[b];
      const aSort = (aEntry.title || a).toLowerCase();
      const bSort = (bEntry.title || b).toLowerCase();
      return aSort < bSort ? -1 : 1;
    });
  for (const name of sortedEntries) {
    const entry = contents[name];
    page += renderEntry(sectionName, name, entry);
  }
  return page;
}

function dumpPage(outPath, sectionName, renderedPage) {
  const outputPath = outPath || DEFAULT_DOCS_PATH;
  const pagePath = path.join(outputPath, `${sectionName}.md`);
  fs.mkdirSync(outputPath, { recursive: true });
  fs.writeFileSync(pagePath, renderedPage);
}

function dump(outPath) {
  dumpPage(outPath, 'resources', renderPage('resources', registry.resources));
  dumpPage(outPath, 'actions', renderPage('actions', registry.actions));
  dumpPage(outPath, 'events', renderPage('events', registry.events));
  dumpPage(outPath, 'panels', renderPage('panels', registry.panels));
  dumpPage(outPath, 'conditions', renderPage('conditions',
    registry.conditions));
  dumpPage(outPath, 'fieldtypes', renderPage('fieldtypes',
    Validations));
}

dump(program.outPath);
