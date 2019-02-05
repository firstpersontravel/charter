import React from 'react';
import PropTypes from 'prop-types';

export default function AssetsAsset({ asset }) {
  return (
    <div>
      <h1 className="constrain-text">{asset.name}</h1>
    </div>
  );
}

AssetsAsset.propTypes = {
  asset: PropTypes.object.isRequired
};
