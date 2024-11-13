import React, { useState, useEffect } from 'react';
import { FileText } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from './CustomComponents';
import { Alert, AlertTitle, AlertDescription } from './CustomComponents';

import SuggestionList from './SuggestionList';
import DocumentExport from './DocumentExport';
import apiUrl from '../config';


const DocumentList = () => {
  const [documents, setDocuments] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    try {
      const response = await fetch(`${apiUrl}/documents/`, {
        headers: {
		  'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        }
      });
      if (!response.ok) throw new Error('Failed to fetch documents');
      const data = await response.json();
      setDocuments(data);
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>My Documents</CardTitle>
      </CardHeader>
      <CardContent>
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        <div className="grid gap-4">
          {documents.map((doc) => (
            <div key={doc.id} className="flex items-center justify-between p-4 border rounded">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                <span>{doc.title}</span>
              </div>
              <div className="flex gap-2">
                <DocumentExport id={doc.id} />
                <SuggestionList document={doc} />
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default DocumentList;
