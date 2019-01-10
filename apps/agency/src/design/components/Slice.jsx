import React from 'react';
import PropTypes from 'prop-types';

import ContentTree from '../partials/ContentTree';

export default function Slice({ children, params, script }) {
  return (
    <div className="row row-eq-height script-editor-container">
      <div className="script-editor-col col-4">
        <ContentTree
          sliceType={params.sliceType}
          sliceName={params.sliceName}
          script={script} />
      </div>
      <div className="script-editor-col col-8">
        {children}
      </div>
    </div>
  );
}

Slice.propTypes = {
  children: PropTypes.node.isRequired,
  params: PropTypes.object.isRequired,
  script: PropTypes.object.isRequired
};
