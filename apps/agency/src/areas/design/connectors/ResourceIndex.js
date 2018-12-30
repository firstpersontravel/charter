import _ from 'lodash';
import { connect } from 'react-redux';

import ResourceIndex from '../components/ResourceIndex';

const mapStateToProps = (state, ownProps) => {
  const script = _.find(state.datastore.scripts, {
    id: Number(ownProps.params.scriptId)
  });
  const collectionName = ownProps.params.collectionName;
  const resourceName = ownProps.params.resourceName;
  return {
    script: script,
    collectionName: collectionName,
    resourceName: resourceName
  };
};

const mapDispatchToProps = dispatch => ({});

export default connect(mapStateToProps, mapDispatchToProps)(ResourceIndex);
