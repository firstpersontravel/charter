import _ from 'lodash';
import { connect } from 'react-redux';

import UsersIndex from '../components/users-index';
import { createInstance } from '../../../actions';

const mapStateToProps = (state, ownProps) => ({
  users: state.datastore.users,
  profiles: _.filter(state.datastore.profiles, { isArchived: false })
});

const mapDispatchToProps = dispatch => ({
  createInstance: (collectionName, fields) => {
    dispatch(createInstance(collectionName, fields));
  }
});

export default connect(mapStateToProps, mapDispatchToProps)(UsersIndex);
