import React from 'react';
import PropTypes from 'prop-types';
import { CompactPicker } from 'react-color';

function ColorField({
  script, spec, value, name, path, opts, onPropUpdate
}) {
  const valOrDefault = value || spec.default;
  const isWhiteOrBlank = !valOrDefault || valOrDefault.toLowerCase() === '#ffffff';
  const [isEditing, setEditing] = React.useState(false);
  const colorStyle = {
    display: 'inline-block',
    cursor: 'pointer',
    marginLeft: '0.3em',
    marginTop: '0.3em',
    background: valOrDefault || '#fff',
    border: isWhiteOrBlank ? '2px dotted #aaa' : null,
    borderRadius: '2px',
    width: '2em',
    height: '1em'
  };

  const editor = isEditing ? (
    <div
      style={{ position: 'absolute', zIndex: 2 }}
      onClick={() => setEditing(false)}>
      <div
        style={{
          position: 'fixed', top: 0, left: 0, bottom: 0, right: 0
        }}
        onClick={() => setEditing(false)} />
      <CompactPicker
        color={valOrDefault}
        onChange={val => onPropUpdate(path, val.hex)} />
    </div>
  ) : null;
  return (
    <>
      <div style={colorStyle} onClick={() => setEditing(true)} />
      {editor}
    </>
  );
}

ColorField.propTypes = {
  script: PropTypes.object.isRequired,
  spec: PropTypes.object.isRequired,
  value: PropTypes.string,
  name: PropTypes.string.isRequired,
  path: PropTypes.string.isRequired,
  opts: PropTypes.object,
  onPropUpdate: PropTypes.func.isRequired
};

ColorField.defaultProps = {
  value: '',
  opts: {}
};

export default ColorField;
