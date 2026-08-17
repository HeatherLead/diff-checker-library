import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import DiffChecker from './DiffChecker';

function App() {
  const defaultBaseUrl = "https://tms-next-be.wcms.cloud";

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/diff-checker/*" element={<DiffChecker base_url={defaultBaseUrl} base_path="/diff-checker" />} />
        <Route path="/*" element={<DiffChecker base_url={defaultBaseUrl} base_path="" />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
