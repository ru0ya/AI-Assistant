import React from 'react';
import { Download } from 'lucide-react';
import { Button } from './CustomComponents';
import apiUrl from '../config';


const DocumentExport = ({ id }) => {
  const handleExport = async () => {
    try {
      const response = await fetch(`${apiUrl}/documents/${id}/export/`, {
        method: 'POST',
        headers: {
		  'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        }
      });

      if (!response.ok) throw new Error('Export failed');

      // Create blob from response and trigger download
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'document.docx';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      console.error('Error exporting document:', err);
    }
  };

  return (
    <Button onClick={handleExport} className="flex items-center gap-2">
      <Download className="w-4 h-4" />
      Export
    </Button>
  );
};

export default DocumentExport;
