import React from 'react';
import { Redirect } from 'react-router';

export default function PublicHome() {
  return <Redirect to="/login" />;
}
