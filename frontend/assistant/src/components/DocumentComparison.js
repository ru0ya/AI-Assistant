import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent } from './CustomComponents';
import { ScrollArea } from './CustomComponents';
import { Alert, AlertDescription } from './CustomComponents';
import { Button } from './CustomComponents';
import { ArrowLeftRight, Maximize2, Minimize2, Loader2 } from 'lucide-react';
import apiUrl from '../config';

const DocumentComparison = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [fullScreen, setFullScreen] = useState(false);
  const [showDiff, setShowDiff] = useState(true);
  const [originalText, setOriginalText] = useState('');
  const [improvedText, setImprovedText] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
	  const fetchComparisonData = async () => {
		  try {
			  const accessToken = localStorage.getItem('accessToken');
			  if (!accessToken) {
				  throw new Error('No authentication token found.Please login again.');
			  }

			  const response = await fetch(`${apiUrl}/documents/${id}/compare/`, {
				  headers: {
					  'Authorization': `Bearer ${accessToken}`
				  }
			  });

			  if (!response.ok) {
				  throw new Error('Failed to fetch comparison data');
			  }

			  const data = await response.join();
			  setOriginalText(data.original_content || '');
			  setImprovedText(data.improved_content || '');
		  } catch (err) {
			  setError(err.message);
			  console.error('Error fetching comparison data:', err);
		  } finally {
			  setLoading(false);
		  }
	  };

	  if (id) {
		  fetchComparisonData();
	  }
  }, [id]);

  const highlightDifferences = (text1 = '', text2 = '') => {
    if (!text1 || !text2) return text2;
    
    const words1 = text1.split(/\s+/);
    const words2 = text2.split(/\s+/);
    
    return words2.map((word, index) => {
      const isChanged = index >= words1.length || words1[index] !== word;
      
      return (
        <span
          key={`${word}-${index}`}
          className={`inline-block ${
            isChanged && showDiff
              ? 'bg-green-100 dark:bg-green-900/30 px-0.5 rounded'
              : ''
          }`}
        >
          {word}{' '}
        </span>
      );
    });
  };

  if (loading) {
    return (
      <Card className="w-full">
        <CardContent className="flex items-center justify-center min-h-[400px]">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">
              Processing document...
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="w-full">
        <CardContent className="p-6">
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
          <Button 
            className="mt-4"
            onClick={() => navigate('/document-upload')}
          >
            Back to Upload
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`${fullScreen ? 'fixed inset-4 z-50' : 'w-full'}`}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <CardTitle className="text-xl font-bold">Document Comparison</CardTitle>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowDiff(!showDiff)}
          >
            <ArrowLeftRight className="h-4 w-4 mr-2" />
            {showDiff ? 'Hide' : 'Show'} Changes
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setFullScreen(!fullScreen)}
          >
            {fullScreen ? (
              <Minimize2 className="h-4 w-4" />
            ) : (
              <Maximize2 className="h-4 w-4" />
            )}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h3 className="font-semibold mb-2">Original Text</h3>
            <ScrollArea className="h-[400px] w-full rounded-md border p-4">
              <div className="whitespace-pre-wrap">{originalText}</div>
            </ScrollArea>
          </div>
          <div>
            <h3 className="font-semibold mb-2">Improved Text</h3>
            <ScrollArea className="h-[400px] w-full rounded-md border p-4">
              <div className="whitespace-pre-wrap">
                {highlightDifferences(originalText, improvedText)}
              </div>
            </ScrollArea>
          </div>
        </div>
        
        <Alert className="mt-4">
          <AlertDescription>
            Changes are highlighted in green. You can toggle the highlighting using the button above.
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
};

export default DocumentComparison;
