import React from 'react';

export default function Loader() {
  return (
    <div className="row" style={{ height: 'calc(100% - 66px)' }}>
      <div className="col-sm-12 my-auto">
        <div className="w-25 mx-auto" style={{ textAlign: 'center' }}>
          <div className="spinner-border" role="status">
            <span className="sr-only">Loading...</span>
          </div>
        </div>
      </div>
    </div>
  );
}
