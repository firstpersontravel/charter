import React from 'react';
import { Link } from 'react-router-dom';

//Instead of this should just take you back to login screen - Linda
export default function PublicLoggedOut() {
  return (
    <div className="container d-flex h-100 justify-content-center">
      <div className="col-md-3 flex align-self-center">
        <p className="text-center">Bye! 👋</p>
        <div>
          <Link to="/login" className="btn btn-primary w-100">Log in</Link>
        </div>
      </div>
    </div>
  );
}

PublicLoggedOut.propTypes = {};

PublicLoggedOut.defaultProps = {};
