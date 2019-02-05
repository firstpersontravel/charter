import React from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router';

import { withLoader } from '../../loader-utils';

function Assets({ assets, children, script }) {
  if (!assets.length && assets.isLoading) {
    return <div>Loading</div>;
  }
  if (assets.isError) {
    return <div>Error</div>;
  }

  const renderedAssets = assets.map(asset => (
    <div key={asset.name} className="constrain-text">
      <Link
        activeClassName="bold"
        to={
          `/${script.org.name}/${script.experience.name}` +
          `/design/script/${script.revision}` +
          `/assets/${asset.name}`
        }>
        {asset.type}: {asset.name}
      </Link>
    </div>
  ));

  return (
    <div className="row">
      <div className="col-sm-4">
        {renderedAssets}
      </div>
      <div className="col-sm-8">
        {children}
      </div>
    </div>
  );
}

Assets.propTypes = {
  assets: PropTypes.array.isRequired,
  script: PropTypes.object.isRequired,
  children: PropTypes.node.isRequired
};

export default withLoader(Assets, ['script.id'], (props) => {
  props.listCollection('assets', {
    experienceId: props.script.experienceId,
    orgId: props.script.orgId
  });
});
