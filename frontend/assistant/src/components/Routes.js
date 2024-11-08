import React from 'react';
import { BrowserRouter as Router, Route, Routes as ReactRoutes } from 'react-router-dom';

import AuthComponent from './AuthComponent';
import DocumentUpload from './DocumentUpload';
import DocumentList from './DocumentList';

const Routes = () => {
  return (
    <Router>
      <ReactRoutes>
        <Route path="/login" element={<AuthComponent />} />
        <Route path="/documents" element={<DocumentUpload />} />
        <Route path="/documents/list" element={<DocumentList />} />
        <Route path="*" element={<AuthComponent />} />
      </ReactRoutes>
    </Router>
  );
};

export default Routes;
