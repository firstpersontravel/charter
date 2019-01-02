import React from 'react';
import { Link } from 'react-router';

export default function Home() {
  return (
    <div className="container-fluid">
      Hi there! <Link to="/login">Login</Link>
    </div>
  );
}
