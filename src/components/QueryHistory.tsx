import React, { useState } from 'react';
import { Clock, Star, Trash2, Download, Play, Search } from 'lucide-react';

interface QueryHistoryProps {
  history: any[];
  loading: boolean;
  onItemClick: (query: string) => void;
  onToggleFavorite: (id: number) => void;
  onDelete: (id: number) => void;
  onDownload: (id: number) => void;
}

const QueryHistory: React.FC<QueryHistoryProps> = ({
  history,
  loading,
  onItemClick,
  onToggleFavorite,
  onDelete,
  onDownload
}) => {
  const [filter, setFilter] = useState('all'); // 'all', 'favorites'
  const [searchTerm, setSearchTerm] = useState('');
  
  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-8 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
        <span className="ml-2 text-gray-600">Loading query history...</span>
      </div>
    );
  }
  
  const filteredHistory = history
    .filter(item => {
      if (filter === 'favorites') {
        return item.is_favorite;
      }
      return true;
    })
    .filter(item => {
      if (!searchTerm) return true;
      return item.query_text.toLowerCase().includes(searchTerm.toLowerCase());
    });
  
  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      <div className="p-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Query History</h2>
        
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-2 sm:space-y-0">
          <div className="flex space-x-2">
            <button
              onClick={() => setFilter('all')}
              className={`px-3 py-1.5 text-sm rounded-md ${
                filter === 'all'
                  ? 'bg-blue-100 text-blue-700'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              All Queries
            </button>
            <button
              onClick={() => setFilter('favorites')}
              className={`px-3 py-1.5 text-sm rounded-md ${
                filter === 'favorites'
                  ? 'bg-blue-100 text-blue-700'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Favorites
            </button>
          </div>
          
          <div className="relative w-full sm:w-64">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search queries..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
            />
          </div>
        </div>
      </div>
      
      {filteredHistory.length === 0 ? (
        <div className="p-8 text-center text-gray-500">
          {filter === 'favorites' ? 'No favorite queries yet.' : 'No queries in history.'}
        </div>
      ) : (
        <div className="overflow-y-auto max-h-[calc(100vh-300px)]">
          <ul className="divide-y divide-gray-200">
            {filteredHistory.map(item => (
              <li key={item.id} className="p-4 hover:bg-gray-50">
                <div className="flex justify-between items-start">
                  <div className="flex-1 mr-4">
                    <div className="flex items-center mb-1">
                      <Clock className="h-4 w-4 text-gray-400 mr-1" />
                      <span className="text-xs text-gray-500">
                        {new Date(item.executed_at).toLocaleString()}
                      </span>
                    </div>
                    <pre className="text-sm text-gray-700 whitespace-pre-wrap break-words bg-gray-50 p-2 rounded border border-gray-200 mt-1">
                      {item.query_text}
                    </pre>
                  </div>
                  
                  <div className="flex flex-col space-y-2">
                    <button
                      onClick={() => onItemClick(item.query_text)}
                      title="Run query"
                      className="p-1.5 text-blue-600 hover:bg-blue-100 rounded-full"
                    >
                      <Play className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => onToggleFavorite(item.id)}
                      title={item.is_favorite ? 'Remove from favorites' : 'Add to favorites'}
                      className={`p-1.5 rounded-full ${
                        item.is_favorite
                          ? 'text-yellow-500 hover:bg-yellow-100'
                          : 'text-gray-400 hover:bg-gray-100'
                      }`}
                    >
                      <Star className="h-4 w-4" fill={item.is_favorite ? 'currentColor' : 'none'} />
                    </button>
                    <button
                      onClick={() => onDownload(item.id)}
                      title="Download results"
                      className="p-1.5 text-green-600 hover:bg-green-100 rounded-full"
                    >
                      <Download className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => onDelete(item.id)}
                      title="Delete from history"
                      className="p-1.5 text-red-600 hover:bg-red-100 rounded-full"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default QueryHistory;