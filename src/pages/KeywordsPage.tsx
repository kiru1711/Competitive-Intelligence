// src/pages/KeywordsPage.tsx

import React, { useState, useEffect } from 'react';

// A blueprint for our keyword data from the API
interface Keyword {
  id: number;
  url: string;
  created_at: string;
}

const KeywordsPage = () => {
  const [keywords, setKeywords] = useState<Keyword[]>([]);
  const [newKeywordUrl, setNewKeywordUrl] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // 1. Fetch all keywords from our Flask API when the page loads
  useEffect(() => {
    fetch('http://127.0.0.1:5000/api/keywords')
      .then(res => res.json())
      .then(data => {
        setKeywords(data);
        setIsLoading(false);
      })
      .catch(error => console.error("Error fetching keywords:", error));
  }, []);

  // 2. Handle adding a new keyword by calling our Flask API
  const handleAddKeyword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKeywordUrl.trim()) return;

    fetch('http://127.0.0.1:5000/api/keywords', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: newKeywordUrl }),
    })
      .then(res => res.json())
      .then(newKeyword => {
        setKeywords([newKeyword, ...keywords]); // Add new keyword to the top of the list
        setNewKeywordUrl(''); // Clear the input field
      });
  };

  // 3. Handle deleting a keyword by calling our Flask API
  const handleDeleteKeyword = (id: number) => {
    fetch(`http://127.0.0.1:5000/api/keywords/${id}`, {
      method: 'DELETE',
    })
    .then(res => {
      if(res.ok) {
        // Filter out the deleted keyword from the local state to update the UI
        setKeywords(keywords.filter(kw => kw.id !== id));
      }
    });
  };

  if (isLoading) {
    return <div className="p-8 text-white">Loading keywords...</div>;
  }

  return (
    <div className="p-8 text-white">
      <h1 className="text-3xl font-bold mb-8">Manage Keywords</h1>
      
      <form onSubmit={handleAddKeyword} className="flex items-center gap-4 mb-8">
        <input
          type="url"
          value={newKeywordUrl}
          onChange={(e) => setNewKeywordUrl(e.target.value)}
          placeholder="https://example.com/feed"
          className="bg-gray-700 border border-gray-600 rounded-md p-2 w-full text-white flex-grow"
          required
        />
        <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded-md">
          Add
        </button>
      </form>

      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-gray-300 border-b border-gray-700 pb-2">Tracked Feeds</h2>
        {keywords.map(keyword => (
          <div key={keyword.id} className="bg-gray-800 p-4 rounded-lg flex justify-between items-center border border-gray-700">
            <span className="text-gray-300 break-all">{keyword.url}</span>
            <button
              onClick={() => handleDeleteKeyword(keyword.id)}
              className="bg-red-600 hover:bg-red-700 text-white font-bold py-1 px-3 rounded-md text-sm ml-4"
            >
              Delete
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default KeywordsPage;