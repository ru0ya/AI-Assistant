import React from 'react';
import { BrowserRouter as Router, Route, Routes as ReactRoutes } from 'react-router-dom';

import SignUpComponent from './components/Signup';
import SignInComponent from './components/SignIn';
import DocumentComparison from './components/DocumentComparison';
import DocumentUpload from './components/DocumentUpload';
import DocumentList from './components/DocumentList';
import DocumentExport from './components/DocumentExport';

function App() {
  return (
    <Router>
      <ReactRoutes>
        <Route path="/login" element={<SignUpComponent />} />
	    <Route path="/sign-in" element={<SignInComponent />} />
        <Route path="/documents" element={<DocumentUpload />} />
	    <Route path="/document-comparison/:id" element={<DocumentComparison />} />
        <Route path="/documents/list" element={<DocumentList />} />
		<Route path="/document-export/:id" element={<DocumentExport />} />
        <Route path="*" element={<SignUpComponent />} />
      </ReactRoutes>
    </Router>
  );
};

export default App;
