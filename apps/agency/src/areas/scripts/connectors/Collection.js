import _ from 'lodash';
import { connect } from 'react-redux';

import Collection from '../components/Collection';

const mapStateToProps = (state, ownProps) => {
  const script = _.find(state.datastore.scripts, {
    id: Number(ownProps.params.scriptId)
  });
  const collectionName = ownProps.params.collectionName;
  return {
    script: script,
    collectionName: collectionName
  };
};

const mapDispatchToProps = dispatch => ({});

export default connect(mapStateToProps, mapDispatchToProps)(Collection);
