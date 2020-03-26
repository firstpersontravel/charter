import _ from 'lodash';
import { connect } from 'react-redux';

import Role from '../components/Role';

const mapStateToProps = (state, ownProps) => ({
  user: ownProps.match.params.userId !== '0' ?
    _.find(state.datastore.users,
      { id: Number(ownProps.match.params.userId) }) : null
});

const mapDispatchToProps = dispatch => ({});


export default connect(mapStateToProps, mapDispatchToProps)(Role);
