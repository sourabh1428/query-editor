import React from 'react';
import { Database, History, Star, FileText, HelpCircle } from 'lucide-react';

const Sidebar: React.FC = () => {
  return (
    <aside className="w-64 bg-gray-800 text-white">
      <div className="p-4">
        <h2 className="text-2xl font-bold flex items-center">
          <Database className="mr-2 h-6 w-6" />
          SQL Analytics
        </h2>
      </div>
      
      <nav className="mt-6">
        <div className="px-4 py-2 text-xs font-semibold text-gray-400 uppercase">
          Main
        </div>
        
        <a href="#" className="flex items-center px-4 py-3 text-gray-300 bg-gray-700">
          <FileText className="h-5 w-5 mr-3" />
          Query Editor
        </a>
        
        <a href="#" className="flex items-center px-4 py-3 text-gray-300 hover:bg-gray-700">
          <Database className="h-5 w-5 mr-3" />
          Schema Explorer
        </a>
        
        <div className="px-4 py-2 text-xs font-semibold text-gray-400 uppercase mt-4">
          History
        </div>
        
        <a href="#" className="flex items-center px-4 py-3 text-gray-300 hover:bg-gray-700">
          <History className="h-5 w-5 mr-3" />
          Recent Queries
        </a>
        
        <a href="#" className="flex items-center px-4 py-3 text-gray-300 hover:bg-gray-700">
          <Star className="h-5 w-5 mr-3" />
          Favorites
        </a>
        
        <div className="px-4 py-2 text-xs font-semibold text-gray-400 uppercase mt-4">
          Help
        </div>
        
        <a href="#" className="flex items-center px-4 py-3 text-gray-300 hover:bg-gray-700">
          <HelpCircle className="h-5 w-5 mr-3" />
          Documentation
        </a>
      </nav>
    </aside>
  );
};

export default Sidebar;