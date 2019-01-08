import _ from 'lodash';
import { connect } from 'react-redux';

import RoleIndex from '../components/RoleIndex';
import { lookupPlayersByRole } from './utils';

const mapStateToProps = (state, ownProps) => {
  const userId = ownProps.params.userId !== '0' ?
    Number(ownProps.params.userId) : null;
  const user = userId ? _.find(state.datastore.users, { id: userId }) : null;
  return {
    user: user,
    players: lookupPlayersByRole(state, ownProps)
  };
};

const mapDispatchToProps = dispatch => ({});


export default connect(mapStateToProps, mapDispatchToProps)(RoleIndex);
