import React from 'react';

export default function Loader() {
  return (
    <div style={{ textAlign: 'center', padding: '100px' }}>
      <div className="spinner-border" role="status">
        <span className="sr-only">Loading...</span>
      </div>
    </div>
  );
}
