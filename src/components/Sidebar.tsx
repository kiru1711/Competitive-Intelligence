import { Home,  Tag, CheckSquare } from 'lucide-react';

interface SidebarProps {
  currentPage: string;
  onNavigate: (page: string) => void;
}

export default function Sidebar({ currentPage, onNavigate }: SidebarProps) {
  const navItems = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'keywords', label: 'Manage Keywords', icon: Tag },
    { id: 'todos', label: 'To-Do List', icon: CheckSquare },
  ];

  return (
    <div className="w-64 bg-gray-900 min-h-screen fixed left-0 top-0 border-r border-gray-800">
      <div className="p-6">
        <h1 className="text-2xl font-bold text-blue-500">CompIntel</h1>
      </div>

      <nav className="mt-6">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentPage === item.id;

          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`w-full flex items-center gap-3 px-6 py-3 transition-colors ${
                isActive
                  ? 'bg-blue-600 text-white border-l-4 border-blue-400'
                  : 'text-gray-400 hover:bg-gray-800 hover:text-white'
              }`}
            >
              <Icon size={20} />
              <span className="text-sm font-medium">{item.label}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}
