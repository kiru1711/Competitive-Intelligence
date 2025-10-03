import { useState, useEffect } from 'react';
import { Search, ChevronDown, ChevronUp } from 'lucide-react';
import { supabase, Article } from '../lib/supabase';

export default function HomePage() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [filteredArticles, setFilteredArticles] = useState<Article[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedArticle, setExpandedArticle] = useState<string | null>(null);
  const [articlesToSummarize, setArticlesToSummarize] = useState<number>(5);

  useEffect(() => {
    fetchArticles();
  }, []);

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredArticles(articles);
    } else {
      const query = searchQuery.toLowerCase();
      const filtered = articles.filter(
        (article) =>
          article.title.toLowerCase().includes(query) ||
          article.summary.toLowerCase().includes(query) ||
          article.source.toLowerCase().includes(query)
      );
      setFilteredArticles(filtered);
    }
  }, [searchQuery, articles]);

  const fetchArticles = async () => {
    const { data, error } = await supabase
      .from('articles')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching articles:', error);
    } else if (data) {
      setArticles(data);
      setFilteredArticles(data);
    }
  };

  const getImpactColor = (level: string) => {
    switch (level) {
      case 'high':
        return 'bg-red-500';
      case 'medium':
        return 'bg-yellow-500';
      case 'low':
        return 'bg-green-500';
      default:
        return 'bg-gray-500';
    }
  };

  const toggleArticle = (id: string) => {
    setExpandedArticle(expandedArticle === id ? null : id);
  };

  return (
    <div className="p-8">
      <div className="flex gap-6 mb-8">
        <div className="flex-1 bg-gray-800 rounded-lg p-6 border border-gray-700">
          <div className="text-gray-400 text-sm mb-2">Total New Articles Found</div>
          <div className="text-3xl font-bold text-white">{articles.length}</div>
        </div>

        <div className="flex-1 bg-gray-800 rounded-lg p-6 border border-gray-700">
          <label className="text-gray-400 text-sm mb-2 block">
            Number of Articles to Summarize
          </label>
          <input
            type="number"
            value={articlesToSummarize}
            onChange={(e) => setArticlesToSummarize(Number(e.target.value))}
            className="w-full bg-gray-900 text-white px-4 py-2 rounded border border-gray-600 focus:border-blue-500 focus:outline-none"
            min="1"
          />
        </div>
      </div>

      <div className="mb-8">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Search articles..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-gray-800 text-white pl-12 pr-4 py-3 rounded-lg border border-gray-700 focus:border-blue-500 focus:outline-none"
          />
        </div>
      </div>

      <div className="space-y-4">
        {filteredArticles.map((article) => (
          <div
            key={article.id}
            className="bg-gray-800 rounded-lg p-6 border border-gray-700 hover:border-gray-600 transition-colors"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <h3 className="text-xl font-bold text-white mb-2">{article.title}</h3>
                <div className="text-gray-400 text-sm">
                  {article.source} • {article.posted_time}
                </div>
              </div>
              <span
                className={`${getImpactColor(
                  article.impact_level
                )} text-white text-xs px-3 py-1 rounded-full font-medium uppercase ml-4`}
              >
                {article.impact_level}
              </span>
            </div>

            <p className="text-gray-300 mb-4 line-clamp-2">{article.summary}</p>

            {expandedArticle === article.id && (
              <div className="bg-gray-900 rounded p-4 mb-4 border border-gray-700">
                <p className="text-gray-300 whitespace-pre-wrap">{article.full_content}</p>
              </div>
            )}

            <button
              onClick={() => toggleArticle(article.id)}
              className="flex items-center gap-2 text-blue-500 hover:text-blue-400 transition-colors"
            >
              {expandedArticle === article.id ? (
                <>
                  <span>Show Less</span>
                  <ChevronUp size={16} />
                </>
              ) : (
                <>
                  <span>Read More</span>
                  <ChevronDown size={16} />
                </>
              )}
            </button>
          </div>
        ))}

        {filteredArticles.length === 0 && (
          <div className="text-center text-gray-400 py-12">
            {searchQuery ? 'No articles found matching your search.' : 'No articles available.'}
          </div>
        )}
      </div>
    </div>
  );
}
