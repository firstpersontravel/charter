import React from 'react';
import PropTypes from 'prop-types';

import TextPanel from '../panels/text';

const panelTypes = {
  text: TextPanel
};

export default function Panel({ panel, evaluator }) {
  if (panelTypes[panel.type]) {
    const props = { panel: panel, evaluator: evaluator };
    return React.createElement(panelTypes[panel.type], props);
  }
  return (
    <div>
      Unknown type: {panel.type}
    </div>
  );
}

Panel.propTypes = {
  panel: PropTypes.object.isRequired,
  evaluator: PropTypes.object.isRequired
};
