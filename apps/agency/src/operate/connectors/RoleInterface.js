import _ from 'lodash';
import { connect } from 'react-redux';

import { lookupPlayersByRole } from './utils';
import RoleInterface from '../components/RoleInterface';

const mapStateToProps = (state, ownProps) => {
  const userId = ownProps.params.userId !== '0' ?
    Number(ownProps.params.userId) : null;
  const user = userId ? _.find(state.datastore.users, { id: userId }) : null;
  return {
    user: user,
    players: lookupPlayersByRole(state, ownProps)
  };
};

export default connect(mapStateToProps)(RoleInterface);
