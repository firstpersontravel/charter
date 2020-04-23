const _ = require('lodash');
const program = require('commander');

const models = require('../src/models');

const coreRegistry = require('fptcore/src/core-registry');
const TextUtil = require('fptcore/src/utils/text');

program
  .arguments('<resource-type> <property>')
  .parse(process.argv);

function hashCode(s) {
  return s
    .split('')
    .reduce((a, b) => {
      a = ((a << 5) - a) + b.charCodeAt(0);
      return a & a;
    }, 0);
}

async function previewUsage(resourceType, property) {
  if (!coreRegistry.resources[resourceType]) {
    throw new Error(`Invalid resource "${resourceType}".`);
  }
  const scripts = await models.Script.findAll({
    where: { isArchived: false },
    include: [{ model: models.Experience, as: 'experience' }]
  });

  const collectionName = TextUtil.pluralize(resourceType);
  const usage = {};

  for (const script of scripts) {
    const collection = script.content[collectionName];
    if (!collection) {
      continue;
    }
    for (const item of collection) {
      const value = item[property];
      if (_.isUndefined(value)) {
        continue;
      }
      const hash = hashCode(JSON.stringify(value));
      if (!usage[hash]) {
        usage[hash] = {
          value: value,
          scripts: []
        };
      }
      usage[hash].scripts.push(script);
    }
  }

  const usageItems = Object.values(usage);

  if (!usageItems.length) {
    console.log(`No usages found for ${resourceType}.${property}.`);
    return;
  }
  
  for (const usageItem of usageItems) {
    const scriptDescs = _(usageItem.scripts)
      .groupBy('experienceId')
      .values()
      .map((scripts) => (
        `${scripts[0].experience.title} #${_(scripts).map('id').uniq().value().join(',')}`
      ))
      .value();
    console.log(JSON.stringify(usageItem.value, null, 2));
    console.log(`-> ${scriptDescs.join(', ')}`);
    console.log('');
  }
}

if (program.args.length < 2) {
  program.help();
}


previewUsage(...program.args)
  .then(() => {
    process.exit(0);
  })
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
