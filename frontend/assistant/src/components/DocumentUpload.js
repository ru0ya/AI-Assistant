import React, { useState } from 'react';
import { Upload } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from './CustomComponents';
import { Button } from './CustomComponents';
import { Alert, AlertTitle, AlertDescription } from './CustomComponents';
import apiUrl from '../config';


const DocumentUpload = () => {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);

  const handleUpload = async () => {
    if (!file) return;

    const formData = new FormData();
    formData.append('document', file);
    setUploading(true);
    setError(null);

    try {
		const accessToken = localStorage.getItem('accessToken');

		if (!accessToken) {
			throw new Error('No authentication token found.Please login again.');
		}

		const response = await fetch(`${apiUrl}/documents/upload/`, {
			method: 'POST',
			headers: {
            'Authorization': `Bearer ${accessToken}`
			},

			body: formData
		});

      if (!response.ok) {
		  const errorData = await response.json();
		  throw new Error(errorData.detail || 'Upload failed');
	  }


      setFile(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Upload Document</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-4">
          <input
            type="file"
            onChange={(e) => setFile(e.target.files[0])}
            accept=".txt,.docx,.pdf"
            className="border p-2 rounded"
          />
          {error && (
            <Alert variant="destructive">
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          <Button
            onClick={handleUpload}
            disabled={!file || uploading}
            className="flex items-center gap-2"
          >
            <Upload className="w-4 h-4" />
            {uploading ? 'Uploading...' : 'Upload Document'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};


export default DocumentUpload;
