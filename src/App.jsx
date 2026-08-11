import React from 'react';
import DiffChecker from './DiffChecker';

function App() {
  return (
    <DiffChecker
      backend_url="https://tms-next-be.wcms.cloud"
      backend_url_2="https://dev-sutradhar-be.wcms.cloud"
    />
  );
}

export default App;
