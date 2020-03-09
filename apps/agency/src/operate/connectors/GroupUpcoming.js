import { connect } from 'react-redux';

import { lookupGroup, lookupUpcomingActions } from './utils';
import { postAdminAction, updateInstance } from '../../actions';
import GroupUpcoming from '../components/GroupUpcoming';

const mapStateToProps = (state, ownProps) => {
  const group = lookupGroup(state, ownProps);
  return {
    group: group,
    actions: lookupUpcomingActions(state, ownProps)
  };
};

const mapDispatchToProps = dispatch => ({
  postAdminAction: (...args) => dispatch(postAdminAction(...args)),
  updateInstance: (...args) => dispatch(updateInstance(...args))
});

export default connect(mapStateToProps, mapDispatchToProps)(GroupUpcoming);
