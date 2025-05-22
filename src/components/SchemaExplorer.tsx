import React from 'react';
import { Database, Table, Key, Link, Info } from 'lucide-react';

interface SchemaExplorerProps {
  tables: string[];
  selectedTable: string | null;
  tableSchema: any | null;
  loading: boolean;
  onSelectTable: (tableName: string) => void;
}

const SchemaExplorer: React.FC<SchemaExplorerProps> = ({
  tables,
  selectedTable,
  tableSchema,
  loading,
  onSelectTable
}) => {
  return (
    <div className="flex h-full">
      <div className="w-64 bg-white rounded-lg shadow-md overflow-hidden mr-4">
        <div className="p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-800 flex items-center">
            <Database className="h-5 w-5 mr-2 text-blue-500" />
            Tables
          </h2>
        </div>
        
        <div className="overflow-y-auto max-h-[calc(100vh-300px)]">
          <ul className="divide-y divide-gray-200">
            {tables.map(table => (
              <li key={table}>
                <button
                  onClick={() => onSelectTable(table)}
                  className={`w-full text-left px-4 py-3 flex items-center ${
                    selectedTable === table
                      ? 'bg-blue-50 text-blue-700'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <Table className="h-4 w-4 mr-2" />
                  {table}
                </button>
              </li>
            ))}
          </ul>
        </div>
      </div>
      
      <div className="flex-1 bg-white rounded-lg shadow-md overflow-hidden">
        {!selectedTable ? (
          <div className="p-8 text-center text-gray-500 h-full flex flex-col items-center justify-center">
            <Database className="h-12 w-12 text-gray-300 mb-4" />
            <p>Select a table to view its schema</p>
          </div>
        ) : loading ? (
          <div className="p-8 text-center h-full flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
            <span className="ml-2 text-gray-600">Loading schema...</span>
          </div>
        ) : (
          <div className="h-full flex flex-col">
            <div className="p-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-800 flex items-center">
                <Table className="h-5 w-5 mr-2 text-blue-500" />
                {tableSchema?.table}
              </h2>
            </div>
            
            <div className="overflow-y-auto flex-1">
              <div className="p-4">
                <h3 className="text-md font-medium text-gray-700 mb-2 flex items-center">
                  <Info className="h-4 w-4 mr-1 text-blue-500" />
                  Columns
                </h3>
                
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Name
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Type
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Nullable
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Default
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Key
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {tableSchema?.columns.map((column: any, index: number) => (
                        <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {column.column_name}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {column.data_type}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {column.is_nullable === 'YES' ? 'Yes' : 'No'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {column.column_default || '-'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {tableSchema?.primaryKeys.includes(column.column_name) && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                                <Key className="h-3 w-3 mr-1" />
                                PK
                              </span>
                            )}
                            
                            {tableSchema?.foreignKeys.some((fk: any) => fk.column_name === column.column_name) && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800 ml-1">
                                <Link className="h-3 w-3 mr-1" />
                                FK
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                
                {tableSchema?.foreignKeys.length > 0 && (
                  <div className="mt-6">
                    <h3 className="text-md font-medium text-gray-700 mb-2 flex items-center">
                      <Link className="h-4 w-4 mr-1 text-green-500" />
                      Foreign Keys
                    </h3>
                    
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Column
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              References
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {tableSchema?.foreignKeys.map((fk: any, index: number) => (
                            <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                {fk.column_name}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {fk.foreign_table_name}.{fk.foreign_column_name}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
                
                <div className="mt-6">
                  <h3 className="text-md font-medium text-gray-700 mb-2 flex items-center">
                    <Database className="h-4 w-4 mr-1 text-purple-500" />
                    Sample Data
                  </h3>
                  
                  {tableSchema?.sampleData && tableSchema.sampleData.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            {Object.keys(tableSchema.sampleData[0]).map((col: string) => (
                              <th 
                                key={col} 
                                scope="col" 
                                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                              >
                                {col}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {tableSchema.sampleData.map((row: any, rowIndex: number) => (
                            <tr key={rowIndex} className={rowIndex % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                              {Object.keys(row).map((col: string, colIndex: number) => (
                                <td key={colIndex} className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                  {row[col] === null ? (
                                    <span className="text-gray-400 italic">null</span>
                                  ) : (
                                    String(row[col])
                                  )}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <p className="text-gray-500 text-sm italic">No sample data available</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SchemaExplorer;