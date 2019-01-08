import PropTypes from 'prop-types';

export default function Design({ children }) {
  return children;
}

Design.propTypes = {
  children: PropTypes.node.isRequired
};
