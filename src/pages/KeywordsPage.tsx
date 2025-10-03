import { useState, useEffect } from 'react';
import { Plus, X } from 'lucide-react';
import { supabase, Keyword } from '../lib/supabase';

export default function KeywordsPage() {
  const [keywords, setKeywords] = useState<Keyword[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [newKeyword, setNewKeyword] = useState('');

  useEffect(() => {
    fetchKeywords();
  }, []);

  const fetchKeywords = async () => {
    const { data, error } = await supabase
      .from('keywords')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching keywords:', error);
    } else if (data) {
      setKeywords(data);
    }
  };

  const addKeyword = async () => {
    if (!newKeyword.trim()) return;

    const { error } = await supabase
      .from('keywords')
      .insert([{ keyword: newKeyword.trim() }]);

    if (error) {
      console.error('Error adding keyword:', error);
    } else {
      setNewKeyword('');
      setIsAdding(false);
      fetchKeywords();
    }
  };

  const deleteKeyword = async (id: string) => {
    const { error } = await supabase.from('keywords').delete().eq('id', id);

    if (error) {
      console.error('Error deleting keyword:', error);
    } else {
      fetchKeywords();
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-white">Keywords & Competitors</h1>
        <button
          onClick={() => setIsAdding(true)}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
        >
          <Plus size={20} />
          <span>Add Keyword</span>
        </button>
      </div>

      {isAdding && (
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700 mb-6">
          <h3 className="text-white font-medium mb-4">Add New Keyword</h3>
          <div className="flex gap-3">
            <input
              type="text"
              value={newKeyword}
              onChange={(e) => setNewKeyword(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && addKeyword()}
              placeholder="Enter keyword or competitor name..."
              className="flex-1 bg-gray-900 text-white px-4 py-2 rounded border border-gray-600 focus:border-blue-500 focus:outline-none"
              autoFocus
            />
            <button
              onClick={addKeyword}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded transition-colors"
            >
              Add
            </button>
            <button
              onClick={() => {
                setIsAdding(false);
                setNewKeyword('');
              }}
              className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {keywords.map((keyword) => (
          <div
            key={keyword.id}
            className="bg-gray-800 rounded-lg p-6 border border-gray-700 hover:border-gray-600 transition-colors relative group"
          >
            <button
              onClick={() => deleteKeyword(keyword.id)}
              className="absolute top-3 right-3 bg-gray-700 hover:bg-red-600 text-gray-400 hover:text-white p-1 rounded transition-colors opacity-0 group-hover:opacity-100"
            >
              <X size={16} />
            </button>

            <h3 className="text-lg font-bold text-white mb-2">{keyword.keyword}</h3>
            <p className="text-gray-400 text-sm">Added {formatDate(keyword.created_at)}</p>
          </div>
        ))}
      </div>

      {keywords.length === 0 && (
        <div className="bg-gray-800 rounded-lg p-12 border border-gray-700 text-center">
          <p className="text-gray-400 mb-4">No keywords added yet</p>
          <button
            onClick={() => setIsAdding(true)}
            className="text-blue-500 hover:text-blue-400"
          >
            Add your first keyword
          </button>
        </div>
      )}
    </div>
  );
}
