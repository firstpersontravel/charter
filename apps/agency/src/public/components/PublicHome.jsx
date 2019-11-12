import React from 'react';
import { Link, browserHistory } from 'react-router';

export default function PublicHome() {
  browserHistory.push('/login');
  return (
    <div className="container-fluid">
      Hi there! <Link to="/login">Login</Link>
    </div>
  );
}
