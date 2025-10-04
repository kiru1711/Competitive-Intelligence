import { useState, useEffect } from 'react';
import { supabase, Article } from '../lib/supabase';

export default function CategoriesPage() {
  const [selectedImpact, setSelectedImpact] = useState<string | null>(null);
  const [articles, setArticles] = useState<Article[]>([]);
  const [stats, setStats] = useState({ low: 0, medium: 0, high: 0 });

  useEffect(() => {
    fetchArticles();
  }, []);

  const fetchArticles = async () => {
    const { data, error } = await supabase
      .from('articles')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching articles:', error);
    } else if (data) {
      setArticles(data);

      const counts = data.reduce(
        (acc, article) => {
          acc[article.impact_level as keyof typeof acc]++;
          return acc;
        },
        { low: 0, medium: 0, high: 0 }
      );
      setStats(counts);
    }
  };

  const filteredArticles = selectedImpact
    ? articles.filter((article) => article.impact_level === selectedImpact)
    : [];

  const impactLevels = [
    { id: 'low', label: 'Low Impact', color: 'bg-green-500', hoverColor: 'hover:bg-green-600', borderColor: 'border-green-500', count: stats.low },
    { id: 'medium', label: 'Medium Impact', color: 'bg-yellow-500', hoverColor: 'hover:bg-yellow-600', borderColor: 'border-yellow-500', count: stats.medium },
    { id: 'high', label: 'High Impact', color: 'bg-red-500', hoverColor: 'hover:bg-red-600', borderColor: 'border-red-500', count: stats.high },
  ];

  const getBorderColor = (impactLevel: string) => {
    switch (impactLevel) {
      case 'high':
        return 'border-red-500';
      case 'medium':
        return 'border-yellow-500';
      case 'low':
        return 'border-green-500';
      default:
        return 'border-gray-700';
    }
  };

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold text-white mb-8">Categories & Filters</h1>

      <div className="mb-8">
        <h2 className="text-lg text-gray-400 mb-4">Filter by Impact Level</h2>
        <div className="grid grid-cols-3 gap-4">
          {impactLevels.map((level) => (
            <button
              key={level.id}
              onClick={() => setSelectedImpact(selectedImpact === level.id ? null : level.id)}
              className={`${level.color} ${level.hoverColor} text-white rounded-lg p-6 transition-all transform ${
                selectedImpact === level.id ? 'scale-105 ring-4 ring-blue-500' : 'hover:scale-102'
              }`}
            >
              <div className="text-4xl font-bold mb-2">{level.count}</div>
              <div className="text-sm font-medium uppercase">{level.label}</div>
            </button>
          ))}
        </div>
      </div>

      {selectedImpact && (
        <div className="mt-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-white">
              {impactLevels.find((l) => l.id === selectedImpact)?.label} Articles
            </h2>
            <button
              onClick={() => setSelectedImpact(null)}
              className="text-blue-500 hover:text-blue-400 text-sm"
            >
              Clear Filter
            </button>
          </div>

          <div className="space-y-4">
            {filteredArticles.map((article) => (
              <div
                key={article.id}
                className={`bg-gray-800 rounded-lg p-6 border-2 ${getBorderColor(article.impact_level)}`}
              >
                <h3 className="text-lg font-bold text-white mb-2">{article.title}</h3>
                <div className="text-gray-400 text-sm mb-3">
                  {article.source} • {article.posted_time}
                </div>
                <p className="text-gray-300">{article.summary}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {!selectedImpact && (
        <div className="bg-gray-800 rounded-lg p-12 border border-gray-700 text-center">
          <p className="text-gray-400">Select an impact level above to view articles</p>
        </div>
      )}
    </div>
  );
}
