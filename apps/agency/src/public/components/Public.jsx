import PropTypes from 'prop-types';

export default function Public({ children }) {
  return children;
}

Public.propTypes = {
  children: PropTypes.node.isRequired
};

Public.defaultProps = {
  authInfo: null
};
