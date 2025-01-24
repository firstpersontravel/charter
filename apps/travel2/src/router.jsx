import React from 'react';
import { Route } from 'react-router';
import { BrowserRouter } from 'react-router-dom';

function DummyComponent() {
  console.log('dummy');
  return (
    <div>
      hi
    </div>
  );
}

export default (
  <BrowserRouter>
    <Route path="/" component={DummyComponent} />
  </BrowserRouter>
);
