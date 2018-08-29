import React from 'react';
import PropTypes from 'prop-types';

export default function CollectionIndex({ params, collection }) {
  return (
    <div>
      <h3>Resource</h3>
    </div>
  );
}

CollectionIndex.propTypes = {
  params: PropTypes.object.isRequired,
  collection: PropTypes.array.isRequired
};
