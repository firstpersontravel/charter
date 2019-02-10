const _ = require('lodash');
const jsonschema = require('jsonschema');
const { ValidationError } = require('sequelize');

const database = require('../config').database;
const Experience = require('./experience');
const Org = require('./org');

const {
  belongsToField,
  booleanField,
  datetimeField,
  enumStringField,
  jsonField,
  mutableModifier,
  requiredStringField,
  snakeCaseColumns
} = require('../sequelize/fields');

const STRING_SCHEMA = { type: 'string', minLength: 1 };

const COORD_SCHEMA = {
  type: 'array',
  items: { type: 'number' },
  minItems: 2,
  maxItems: 2
};

// Schema for directions type asset
const DIRECTIONS_SCHEMA = {
  type: 'object',
  properties: {
    route: STRING_SCHEMA,
    from_option: STRING_SCHEMA,
    to_option: STRING_SCHEMA,
    start: COORD_SCHEMA,
    end: COORD_SCHEMA,
    steps: {
      type: 'array',
      minItems: 1,
      items: {
        type: 'object',
        properties: {
          start: COORD_SCHEMA,
          instructions: STRING_SCHEMA,
          distance: STRING_SCHEMA
        },
        required: ['start', 'instructions', 'distance'],
        additionalProperties: false
      }
    },
    polyline: STRING_SCHEMA
  },
  required: ['route', 'from_option', 'to_option', 'start', 'end', 'steps',
    'polyline'],
  additionalProperties: false
};

const ALLOWED_EXTENSIONS = {
  audio: ['mp3', 'm4a'],
  video: ['mp4'],
  image: ['jpg', 'jpeg', 'png']
};

// Schema for media assets
const MEDIA_SCHEMA = {
  type: 'object',
  properties: {
    medium: { enum: Object.keys(ALLOWED_EXTENSIONS) },
    path: STRING_SCHEMA,
    url: STRING_SCHEMA
  },
  required: ['medium', 'path', 'url'],
  additionalProperties: false
};

const ASSET_DATA_SCHEMAS = {
  directions: DIRECTIONS_SCHEMA,
  media: MEDIA_SCHEMA
};

const ASSET_DATA_VALIDATORS = {
  media: (data) => {
    const components = data.path.split('.');
    const ext = components[components.length - 1].toLowerCase();
    const mediumExts = ALLOWED_EXTENSIONS[data.medium];
    if (!_.includes(mediumExts, ext)) {
      throw new ValidationError(`data.path for ${data.medium} must have one of the following extensions: ${mediumExts.join(', ')}`);
    }
  }
};

function assetValidator(type) {
  return function() {
    if (type !== this.type) {
      return;
    }
    const schema = ASSET_DATA_SCHEMAS[this.type];
    const validator = new jsonschema.Validator();
    const options = { propertyName: 'data' };
    const data = this.dataValues.data;
    const dataObj = typeof data === 'string' ? JSON.parse(data) : data;
    const result = validator.validate(dataObj, schema, options);
    if (!result.valid) {
      const errorMessages = result.errors
        .map(e => `${e.property} ${e.message}`)
        .join('; ');
      throw new ValidationError(errorMessages, result.errors);
    }
    if (ASSET_DATA_VALIDATORS[this.type]) {
      ASSET_DATA_VALIDATORS[this.type](dataObj);
    }
  };
}

const assetValidators = _(Object.keys(ASSET_DATA_SCHEMAS))
  .map(type => [type, assetValidator(type)])
  .fromPairs()
  .value();

/**
 * Asset model
 */
const Asset = database.define('Asset', snakeCaseColumns({
  createdAt: datetimeField(),
  updatedAt: mutableModifier(datetimeField()),
  type: enumStringField(32, Object.keys(ASSET_DATA_SCHEMAS)),
  name: mutableModifier(requiredStringField(64)),
  data: mutableModifier(jsonField(database, 'Asset', 'data')),
  isArchived: mutableModifier(booleanField(false))
}), {
  validate: assetValidators
});

Asset.belongsTo(Org, belongsToField('org'));
Asset.belongsTo(Experience, belongsToField('experience'));

module.exports = Asset;
