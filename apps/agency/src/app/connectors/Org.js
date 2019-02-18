import _ from 'lodash';
import { connect } from 'react-redux';

import Org from '../components/Org';

import { logout, listCollection } from '../../actions';
import { lookupExperiences } from './utils';

const mapStateToProps = (state, ownProps) => ({
  authInfo: _.get(_.find(state.datastore.auth, { id: 'latest' }),
    'data'),
  org: _.find(state.datastore.orgs, { name: ownProps.params.orgName }),
  experiences: lookupExperiences(state, ownProps)
});

const mapDispatchToProps = dispatch => ({
  listCollection: (...args) => dispatch(listCollection(...args)),
  logout: (...args) => dispatch(logout(...args))
});

export default connect(mapStateToProps, mapDispatchToProps)(Org);
