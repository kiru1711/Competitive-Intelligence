import { useState } from 'react';
import Sidebar from './components/Sidebar';
import HomePage from './pages/HomePage';
import CategoriesPage from './pages/CategoriesPage';
import KeywordsPage from './pages/KeywordsPage';
import TodosPage from './pages/TodosPage';

function App() {
  const [currentPage, setCurrentPage] = useState('home');

  const renderPage = () => {
    switch (currentPage) {
      case 'home':
        return <HomePage />;
      case 'categories':
        return <CategoriesPage />;
      case 'keywords':
        return <KeywordsPage />;
      case 'todos':
        return <TodosPage />;
      default:
        return <HomePage />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 flex">
      <Sidebar currentPage={currentPage} onNavigate={setCurrentPage} />
      <main className="flex-1 ml-64">{renderPage()}</main>
    </div>
  );
}

export default App;
