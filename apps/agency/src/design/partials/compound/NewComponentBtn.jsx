import _ from 'lodash';
import React from 'react';
import PropTypes from 'prop-types';

import { Registry, TextUtil } from 'fptcore';

import PopoverControl from '../../../partials/PopoverControl';
import {
  defaultForSpec,
  doesSpecHaveDefault
} from '../../utils/resource-utils';

function NewComponentBtn({ componentSpec, newPath, onPropUpdate }) {
  const componentType = componentSpec.component;
  const componentClass = Registry.components[componentType];
  const componentTypeKey = componentClass.typeKey;
  const componentOptions = [{ value: '', label: '---' }].concat(Object
    .keys(Registry[componentType])
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
        const variantClass = Registry[componentType][val];
        const newComponent = _(variantClass.properties)
          .keys()
          .filter(key => doesSpecHaveDefault(variantClass.properties[key]))
          .map(key => [key, defaultForSpec(variantClass.properties[key])])
          .concat([[componentTypeKey, val]])
          .fromPairs()
          .value();
        onPropUpdate(newPath, newComponent);
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
