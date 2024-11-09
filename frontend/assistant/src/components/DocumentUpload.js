import React, { useState, useEffect } from 'react';
import { Upload, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent } from './CustomComponents';
import { Button } from './CustomComponents';
import { Alert, AlertTitle, AlertDescription } from './CustomComponents';
import apiUrl from '../config';

const DocumentUpload = () => {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  // Check authentication on mount
  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      localStorage.setItem('redirectAfterLogin', '/document-upload');
      navigate('/signin');
    }
  }, [navigate]);

  const handleUpload = async () => {
    if (!file) return;
    
    const formData = new FormData();
    formData.append('document', file);
    
    setUploading(true);
    setError(null);

    try {
      const accessToken = localStorage.getItem('accessToken');
      if (!accessToken) {
        localStorage.setItem('redirectAfterLogin', '/document-upload');
        navigate('/signin');
        return;
      }

      const response = await fetch(`${apiUrl}/documents/upload/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`
        },
        body: formData
      });

      if (response.status === 401) {
        // Token is invalid or expired
        localStorage.removeItem('accessToken');
        localStorage.setItem('redirectAfterLogin', '/document-upload');
        navigate('/signin');
        return;
      }

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Upload failed');
      }

      const data = await response.json();
      setFile(null);
      
      // Navigate to the comparison page with the actual document ID
      if (data.id) {
        navigate(`/document-comparison/${data.id}`);
      } else {
        throw new Error('No document ID received from server');
      }
    } catch (err) {
      setError(err.message);
      
      // If the error is authentication-related, redirect to sign in
      if (err.message.includes('authentication') || err.message.includes('login')) {
        localStorage.setItem('redirectAfterLogin', '/document-upload');
        navigate('/signin');
      }
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
          <div className="grid w-full max-w-sm items-center gap-1.5">
            <input
              type="file"
              id="document"
              className="hidden"
              onChange={(e) => setFile(e.target.files[0])}
              accept=".txt,.docx,.pdf"
            />
            <label
              htmlFor="document"
              className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800"
            >
              <div className="flex flex-col items-center justify-center pt-5 pb-6">
                <Upload className="h-8 w-8 mb-2 text-gray-500" />
                <p className="mb-2 text-sm text-gray-500">
                  <span className="font-semibold">Click to upload</span> or drag and drop
                </p>
                {file && (
                  <p className="text-sm text-gray-500">Selected: {file.name}</p>
                )}
              </div>
            </label>
          </div>

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
            {uploading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Upload className="w-4 h-4" />
                Upload Document
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default DocumentUpload;
