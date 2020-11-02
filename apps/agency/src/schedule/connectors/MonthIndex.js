import _ from 'lodash';
import { connect } from 'react-redux';

import MonthIndex from '../components/MonthIndex';

const mapStateToProps = (state, ownProps) => ({
  org: _.find(state.datastore.orgs, { name: ownProps.match.params.orgName }),
  experience: _.find(state.datastore.experiences, { name: ownProps.match.params.experienceName })
});

const mapDispatchToProps = dispatch => ({});

export default connect(mapStateToProps, mapDispatchToProps)(MonthIndex);
