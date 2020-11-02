import React from 'react';
import { Link } from 'react-router-dom';

export default function PublicLoggedOut() {
  return (
    <div className="container-fluid">
      <div className="col-md-6 offset-md-3">
        <p>Thanks for coming by! 👋</p>
        <p>
          <Link to="/login" className="btn btn-primary">Log back in</Link>
        </p>
      </div>
    </div>
  );
}

PublicLoggedOut.propTypes = {};

PublicLoggedOut.defaultProps = {};
