import React from 'react';
import PropTypes from 'prop-types';

import { coreRegistry, TextUtil } from 'fptcore';

import PopoverControl from '../../../partials/PopoverControl';
import { defaultFieldsForSpecs } from '../../utils/resource-utils';

function NewComponentBtn({ componentSpec, newPath, onPropUpdate }) {
  const componentType = componentSpec.component;
  const componentClass = coreRegistry.components[componentType];
  const componentTypeKey = componentClass.typeKey;
  const componentOptions = [{ value: '', label: '---' }].concat(Object
    .keys(coreRegistry[componentType])
    .map(key => ({ value: key, label: TextUtil.titleForKey(key) })));

  const newComponentBtn = (
    <span className="btn btn-sm btn-outline-secondary">
      <i className="fa fa-plus" />
    </span>
  );

  return (
    <PopoverControl
      title={`New ${TextUtil.singularize(componentType)}`}
      choices={componentOptions}
      helpText={componentSpec.help}
      onConfirm={(val) => {
        if (!val) {
          return;
        }
        const variantClass = coreRegistry[componentType][val];
        const propertiesKey = componentClass.propertiesKey;
        const newComponentFields = Object.assign(
          defaultFieldsForSpecs(variantClass[propertiesKey]),
          { [componentTypeKey]: val });
        onPropUpdate(newPath, newComponentFields);
      }}
      label={newComponentBtn}
      value={''}
      underlined={false} />
  );
}

NewComponentBtn.propTypes = {
  componentSpec: PropTypes.object.isRequired,
  newPath: PropTypes.string.isRequired,
  onPropUpdate: PropTypes.func.isRequired
};

export default NewComponentBtn;
