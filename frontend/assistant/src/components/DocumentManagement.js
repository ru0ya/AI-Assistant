import React from 'react';

import DocumentUpload from './DocumentUpload';
import DocumentList from './DocumentList';


const DocumentManagement = () => {
  return (
    <div className="max-w-4xl mx-auto p-4 space-y-8">
      <DocumentUpload />
      <DocumentList />
    </div>
  );
};

export default DocumentManagement;
