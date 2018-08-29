import _ from 'lodash';
import { connect } from 'react-redux';

import Index from '../components/Index';

const mapStateToProps = (state, ownProps) => {
  const playthroughs = _.sortBy(_.filter(state.datastore.playthroughs,
    { isArchived: false }), 'date');
  return { groupId: _.get(playthroughs[0], 'groupId') };
};

export default connect(mapStateToProps)(Index);
