import _ from 'lodash';
import { connect } from 'react-redux';

import Index from '../components/Index';

const mapStateToProps = (state, ownProps) => {
  const trips = _.sortBy(_.filter(state.datastore.trips,
    { isArchived: false }), 'date');
  return { groupId: _.get(trips[0], 'groupId') };
};

export default connect(mapStateToProps)(Index);
