import _ from 'lodash';
import { connect } from 'react-redux';

import { lookupGroup, lookupMessages } from './utils';
import RoleMessages from '../components/RoleMessages';

const mapStateToProps = (state, ownProps) => {
  const user = _.find(state.datastore.users,
    { id: Number(ownProps.params.userId) });
  return {
    group: lookupGroup(state, ownProps),
    user: user,
    messages: lookupMessages(state, ownProps)
  };
};

const mapDispatchToProps = dispatch => ({});


export default connect(mapStateToProps, mapDispatchToProps)(RoleMessages);
