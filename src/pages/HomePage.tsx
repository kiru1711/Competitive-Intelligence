// src/pages/HomePage.tsx

import React, { useState } from 'react';
import { Article } from '../types'; // Using the shared types file

// This interface defines the "contract" for the props App.tsx will send
interface HomePageProps {
  totalFound: number;
  numToSummarize: number;
  setNumToSummarize: (num: number) => void;
  handleSummarizeRequest: (e: React.FormEvent) => void;
  summarizedArticles: Article[];
  isLoading: boolean;
  error: string | null;
}

// --- Components ---
// src/pages/HomePage.tsx

const ArticleCard: React.FC<{ article: Article }> = ({ article }) => {
    // This helper maps the impact level to the correct Tailwind CSS border color class
    const borderColorClass = {
        High: 'border-red-500',
        Medium: 'border-yellow-500',
        Low: 'border-green-500',
    }[article.impact] || 'border-gray-700'; // A fallback default color

    return (
        // We construct the className dynamically. Note `border-2` to make it thicker.
        <div className={`bg-gray-800 p-6 rounded-lg border-2 ${borderColorClass}`}>
            <div className="flex justify-between items-start mb-2">
                <h3 className="text-xl font-bold text-white pr-4">{article.title}</h3>
                {article.impact && (
                    <span className={`impact-tag ${article.impact.toLowerCase()}`}>
                        {article.impact}
                    </span>
                )}
            </div>
            <p className="text-sm text-gray-400 mb-4">{article.source}</p>
            <p className="text-gray-300 mb-4">{article.summary}</p>
            <a href={article.link} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">
                Read More
            </a>
        </div>
    );
};

// --- Main Page Component ---
const HomePage: React.FC<HomePageProps> = ({
    totalFound,
    numToSummarize,
    setNumToSummarize,
    handleSummarizeRequest,
    summarizedArticles,
    isLoading,
    error
}) => {
    const [filter, setFilter] = useState('all');

    const filteredArticles = summarizedArticles.filter(article => {
        if (filter === 'all') return true;
        return article.impact?.toLowerCase() === filter;
    });

    return (
        // Added Tailwind classes for padding and layout
        <div className="p-8 text-white">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
                    <h4 className="text-gray-400 text-sm font-medium">Total New Articles Found</h4>
                    <p className="text-5xl font-bold mt-2">{totalFound}</p>
                </div>
                <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
                    <h4 className="text-gray-400 text-sm font-medium">Number of Articles to Summarize</h4>
                    <form onSubmit={handleSummarizeRequest} className="flex items-center mt-2">
                        <input
                            type="number"
                            value={numToSummarize}
                            onChange={(e) => setNumToSummarize(Number(e.target.value))}
                            min="1"
                            max={totalFound > 0 ? totalFound : 1}
                            className="bg-gray-700 border border-gray-600 rounded-l-md p-2 w-full text-white"
                        />
                        <button type="submit" disabled={isLoading} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-r-md">
                            {isLoading ? '...' : 'Summarize'}
                        </button>
                    </form>
                </div>
            </div>

            {error && <p className="text-red-400 mb-4">{error}</p>}

            <div className="mb-8">
                <h4 className="text-gray-400 text-sm font-medium mb-2">Filter by Impact</h4>
                <div className="flex space-x-4">
                    <button onClick={() => setFilter('all')} className="bg-gray-700 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded-lg">All</button>
                    <button onClick={() => setFilter('low')} className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg">Low</button>
                    <button onClick={() => setFilter('medium')} className="bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-2 px-4 rounded-lg">Medium</button>
                    <button onClick={() => setFilter('high')} className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-lg">High</button>
                </div>
            </div>

            <div className="space-y-6">
                <h2 className="text-2xl font-bold">Latest CompIntel Digest</h2>
                {isLoading && summarizedArticles.length === 0 && <p>Loading...</p>}
                {filteredArticles.map((article, index) => (
                    <ArticleCard key={index} article={article} />
                ))}
            </div>
        </div>
    );
};

export default HomePage;