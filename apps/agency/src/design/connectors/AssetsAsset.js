import { connect } from 'react-redux';

import AssetsAsset from '../components/AssetsAsset';
import { lookupAsset } from './utils';

const mapStateToProps = (state, ownProps) => ({
  asset: lookupAsset(state, ownProps)
});

const mapDispatchToProps = dispatch => ({});

export default connect(mapStateToProps, mapDispatchToProps)(AssetsAsset);
