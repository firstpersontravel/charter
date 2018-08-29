import _ from 'lodash';
import { connect } from 'react-redux';

import CollectionIndex from '../components/CollectionIndex';

const mapStateToProps = (state, ownProps) => {
  const script = _.find(state.datastore.scripts, {
    id: Number(ownProps.params.scriptId)
  });
  const collectionName = ownProps.params.collectionName;
  const collection = script ? script.content[collectionName] : [];
  return {
    collection: collection
  };
};

const mapDispatchToProps = dispatch => ({});

export default connect(mapStateToProps, mapDispatchToProps)(CollectionIndex);
