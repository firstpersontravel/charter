import React from 'react';
import { Link } from 'react-router';

export default function PublicHome() {
  return (
    <div className="container-fluid">
      Hi there! <Link to="/login">Login</Link>
    </div>
  );
}
