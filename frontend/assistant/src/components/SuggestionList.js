import React, { useState } from 'react';
import { Check } from 'lucide-react';
import { Button } from './CustomComponents';
import apiUrl from '../config';


const SuggestionList = ({ document }) => {
  const [suggestions, setSuggestions] = useState([]);

  const applySuggestion = async (suggestionId) => {
    try {
      const response = await fetch(`${apiUrl}/documents/${document.id}/apply_suggestion/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
        },
        body: JSON.stringify({ suggestion_id: suggestionId })
      });

      if (!response.ok) throw new Error('Failed to apply suggestion');

      // Update suggestions list
      setSuggestions(suggestions.map(s =>
        s.id === suggestionId ? { ...s, status: 'applied' } : s
      ));
    } catch (err) {
      console.error('Error applying suggestion:', err);
    }
  };

  return (
    <div className="space-y-4">
      {suggestions.map((suggestion) => (
        <div key={suggestion.id} className="flex items-center justify-between p-4 border rounded">
          <div>
            <div className="text-sm text-red-500 line-through">{suggestion.original_text}</div>
            <div className="text-sm text-green-500">{suggestion.improved_text}</div>
            <div className="text-xs text-gray-500">Type: {suggestion.type}</div>
          </div>
          {suggestion.status !== 'applied' && (
            <Button
              onClick={() => applySuggestion(suggestion.id)}
              className="flex items-center gap-2"
            >
              <Check className="w-4 h-4" />
              Apply
            </Button>
          )}
        </div>
      ))}
    </div>
  );
};

export default SuggestionList;
