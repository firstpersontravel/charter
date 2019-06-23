import React from 'react';
import PropTypes from 'prop-types';

import BaseEmpty from './BaseEmpty';
import BaseEnum from './BaseEnum';

function choicesForOptions(options, value) {
  const choices = options.map(opt => ({ value: opt, label: opt }));
  if (value === null || value === undefined || value === '') {
    choices.unshift({ value: '', label: '---' });
  }
  return choices;
}

function labelForValue(spec, value) {
  if (value) {
    return (
      <span style={{ fontWeight: 'bold', whiteSpace: 'nowrap' }}>
        {value}
      </span>
    );
  }
  return <BaseEmpty spec={spec} />;
}

function EnumField({ spec, value, name, path, opts, onPropUpdate }) {
  return (
    <BaseEnum
      spec={spec}
      value={value}
      name={name}
      path={path}
      opts={opts}
      choices={choicesForOptions(spec.options, value)}
      label={labelForValue(spec, value)}
      onPropUpdate={onPropUpdate} />
  );
}

EnumField.propTypes = {
  spec: PropTypes.object.isRequired,
  value: PropTypes.string,
  name: PropTypes.string.isRequired,
  path: PropTypes.string.isRequired,
  opts: PropTypes.object,
  onPropUpdate: PropTypes.func.isRequired
};

EnumField.defaultProps = {
  value: '',
  opts: {}
};

export default EnumField;
