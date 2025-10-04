import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import HomePage from './pages/HomePage';
import KeywordsPage from './pages/KeywordsPage';
import TodosPage from './pages/TodosPage';

// --- CONFIGURATION ---
const API_BASE_URL = 'http://127.0.0.1:5000'; // Flask server address

// --- TYPE DEFINITION (Helps TypeScript understand the API response) ---
import { Article } from './types';

// ----------------------------------------------------------------------
// THE MAIN APPLICATION COMPONENT (Combines Navigation and Data Fetching)
// ----------------------------------------------------------------------
const App = () => {
    // STATE FOR NAVIGATION (Original Logic)
    const [currentPage, setCurrentPage] = useState('home');

    // STATE FOR DATA FETCHING (New Logic)
    const [totalFound, setTotalFound] = useState(0);
    const [numToSummarize, setNumToSummarize] = useState(1);
    const [summarizedArticles, setSummarizedArticles] = useState<Article[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // --- LOGIC TO RENDER THE CURRENT PAGE (Original Logic) ---
    const renderPage = () => {
        switch (currentPage) {
            case 'home':
                // RENDER THE HOMEPAGE WITH THE NEW DATA PROPS
                return (
                    <HomePage 
                        totalFound={totalFound}
                        numToSummarize={numToSummarize}
                        setNumToSummarize={setNumToSummarize}
                        handleSummarizeRequest={handleSummarizeRequest}
                        summarizedArticles={summarizedArticles}
                        isLoading={isLoading}
                        error={error}
                    />
                );
           
            case 'keywords':
                return <KeywordsPage />;
            case 'todos':
                return <TodosPage />;
            default:
                return <HomePage 
                        totalFound={totalFound}
                        numToSummarize={numToSummarize}
                        setNumToSummarize={setNumToSummarize}
                        handleSummarizeRequest={handleSummarizeRequest}
                        summarizedArticles={summarizedArticles}
                        isLoading={isLoading}
                        error={error}
                    />;
        }
    };


    // --- FUNCTION TO FETCH & SUMMARIZE ARTICLES (New Logic) ---
// src/App.tsx

// --- FUNCTION TO FETCH & SUMMARIZE ARTICLES (UPGRADED WITH SORTING) ---
const fetchArticles = async (num: number) => {
    setIsLoading(true);
    setError(null);

    try {
        const response = await fetch(`${API_BASE_URL}/api/digest/${num}`);
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || `HTTP error! Status: ${response.status}`);
        }
        
        const data = await response.json();

        // --- NEW SORTING LOGIC ---
        const impactOrder: { [key: string]: number } = { 'High': 3, 'Medium': 2, 'Low': 1 };
        
        const sortedArticles = (data.summarized_articles || []).sort((a: Article, b: Article) => {
            const impactA = impactOrder[a.impact] || 0;
            const impactB = impactOrder[b.impact] || 0;
            return impactB - impactA; // Sorts in descending order (High first)
        });
        // --- END OF NEW LOGIC ---

        setTotalFound(data.total_found);
        setSummarizedArticles(sortedArticles); // Set the newly sorted articles

    } catch (err: unknown) {
        let errorMessage = "An unknown error occurred.";
        if (err instanceof Error) {
            errorMessage = `API/Network Error: ${err.message}`;
        } else if (typeof err === 'string') {
            errorMessage = `API/Network Error: ${err}`;
        }
        console.error("API/Network Error:", errorMessage, err);
        setError(errorMessage); 
    } finally {
        setIsLoading(false);
    }
};
    // --- HANDLER: Called when the user clicks 'Enter' or 'Submit' ---
    const handleSummarizeRequest = (e: React.FormEvent) => {
        e.preventDefault(); 
        if (numToSummarize > 0 && numToSummarize <= totalFound) {
            fetchArticles(numToSummarize);
        } else {
            setError(`Please enter a number between 1 and ${totalFound}.`);
        }
    };

// --- EFFECT: Run once on initial load (New Logic) ---
useEffect(() => {
    // Call fetchArticles with the DEFAULT value (5) to populate the boxes initially
    // Using a constant value satisfies Eslint's dependency rules for a run-once effect.
    fetchArticles(1); 
}, []);

    // --- MAIN RENDER (Original Structure) ---
    return (
        // The original wrapper div
        <div className="min-h-screen bg-gray-950 flex">
            <Sidebar currentPage={currentPage} onNavigate={setCurrentPage} />
            {/* The main content area, where the Homepage is rendered */}
            <main className="flex-1 ml-64">
                {/* Renders the selected page, passing the data and handlers to HomePage */}
                {renderPage()}
            </main>
        </div>
    );
};

export default App; // Single export is correct