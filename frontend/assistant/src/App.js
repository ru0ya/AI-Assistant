import React from 'react';
import { BrowserRouter as Router, Route, Routes as ReactRoutes } from 'react-router-dom';

import SignUpComponent from './components/Signup';
import SignInComponent from './components/SignIn';
import DocumentUpload from './components/DocumentUpload';
import DocumentList from './components/DocumentList';

function App() {
  return (
    <Router>
      <ReactRoutes>
        <Route path="/login" element={<SignUpComponent />} />
	    <Route path="/sign-in" element={<SignInComponent />} />
        <Route path="/documents" element={<DocumentUpload />} />
        <Route path="/documents/list" element={<DocumentList />} />
        <Route path="*" element={<SignUpComponent />} />
      </ReactRoutes>
    </Router>
  );
};

export default App;
