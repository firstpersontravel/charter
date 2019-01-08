import { connect } from 'react-redux';

import ResourceIndex from '../components/ResourceIndex';
import { lookupScript } from './utils';

const mapStateToProps = (state, ownProps) => ({
  script: lookupScript(state, ownProps)
});

const mapDispatchToProps = dispatch => ({});

export default connect(mapStateToProps, mapDispatchToProps)(ResourceIndex);
