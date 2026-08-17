import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import DiffChecker from './DiffChecker';

function App() {
  const defaultBaseUrl = "https://tms-next-be.wcms.cloud";

  return (
    <BrowserRouter>
      <Routes>
        {/* Mount directly at /diff-checker (matching consumer pattern) */}
        <Route path="/diff-checker/*" element={<DiffChecker base_url={defaultBaseUrl} basePath="/diff-checker" />} />
        
        {/* Also allow direct root routes during local development */}
        <Route path="/*" element={<DiffChecker base_url={defaultBaseUrl} basePath="" />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
