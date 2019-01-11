import React from 'react';
import PropTypes from 'prop-types';

import ContentTree from '../partials/ContentTree';

import { getContentList } from './utils';

export default function Slice({ children, params, script }) {
  const contentList = getContentList(script.content,
    params.sliceType, params.sliceName);
  return (
    <div className="row row-eq-height script-editor-container">
      <div className="script-editor-col col-4">
        <ContentTree
          sliceType={params.sliceType}
          sliceName={params.sliceName}
          contentList={contentList}
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
