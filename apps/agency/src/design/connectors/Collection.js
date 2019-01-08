import { connect } from 'react-redux';

import Collection from '../components/Collection';
import { lookupScript } from './utils';

const mapStateToProps = (state, ownProps) => ({
  script: lookupScript(state, ownProps)
});

const mapDispatchToProps = dispatch => ({});

export default connect(mapStateToProps, mapDispatchToProps)(Collection);
