import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Moon, Sun, LayoutDashboard, History, Database, Settings, LogOut, Download, Trash2, Clock, Play, Copy, Loader2 } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import QueryEditor from '../components/QueryEditor';
import { useTheme } from '../components/theme-provider';
import { useToast } from '../components/ui/use-toast';
import QueryResults from '../components/QueryResults';
import SchemaExplorer from '../components/SchemaExplorer';
import { apiService } from '../services/api';

interface QueryResult {
  [key: string]: any;
}

interface NavLink {
  label: string;
  tab?: string;
  icon: React.ElementType;
  href?: string;
}

interface QueryHistoryItem {
  id: number;
  query_text: string;
  created_at: string;
  user_id: number;
  status?: string;
  favorite?: boolean;
}

const Dashboard: React.FC = () => {
  const [query, setQuery] = useState('SELECT * FROM customers LIMIT 10;');
  const [results, setResults] = useState<QueryResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<string>('editor');
  const [history, setHistory] = useState<QueryHistoryItem[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [tables, setTables] = useState<string[]>([]);
  const [selectedTable, setSelectedTable] = useState<string | null>(null);
  const [tableSchema, setTableSchema] = useState<any | null>(null);
  const [schemaLoading, setSchemaLoading] = useState(false);
  const [activeEditorTab, setActiveEditorTab] = useState('editor');

  const { user, logout } = useAuth();
  const { theme, setTheme } = useTheme();
  const { toast } = useToast();

  useEffect(() => {
    fetchHistory();
    fetchTables();
  }, []);

  const executeQuery = async () => {
    if (!query.trim()) {
      toast({
        title: "Error",
        description: "Please enter a query",
        variant: "destructive",
      });
      return;
    }
    setLoading(true);
    try {
      const data = await apiService.executeQuery(query);
      setResults(data.result);
      setActiveEditorTab('results');
      toast({
        title: "Success",
        description: "Query executed successfully",
      });
      fetchHistory();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || 'Error executing query',
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchHistory = async () => {
    setHistoryLoading(true);
    try {
      const data = await apiService.getQueryHistory();
      setHistory(data.history || []);
    } catch (error) {
      console.error('Error fetching history:', error);
      toast({
        title: "Error",
        description: "Failed to load query history",
        variant: "destructive",
      });
    } finally {
      setHistoryLoading(false);
    }
  };

  const fetchTables = async () => {
    try {
      const data = await apiService.getTables();
      setTables(data.tables || []);
    } catch (error) {
      console.error('Error fetching tables:', error);
      toast({
        title: "Error",
        description: "Failed to load database tables",
        variant: "destructive",
      });
    }
  };

  const fetchTableSchema = async (tableName: string) => {
    setSchemaLoading(true);
    setSelectedTable(tableName);
    try {
      const data = await apiService.getTableSchema(tableName);
      setTableSchema(data);
    } catch (error) {
      console.error('Error fetching table schema:', error);
    } finally {
      setSchemaLoading(false);
    }
  };

  const deleteQuery = async (queryId: number) => {
    try {
      await apiService.deleteQuery(queryId);
      fetchHistory();
      toast({
        title: "Success",
        description: "Query deleted from history",
      });
    } catch (error) {
      console.error('Error deleting query:', error);
      toast({
        title: "Error",
        description: "Failed to delete query",
        variant: "destructive",
      });
    }
  };

  const downloadResults = async (queryId: number) => {
    try {
      const blob = await apiService.downloadQueryResults(queryId);
      
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `query-results-${queryId}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      
      toast({
        title: "Success",
        description: "Download started",
      });
    } catch (error) {
      console.error('Error downloading results:', error);
      toast({
        title: "Error",
        description: "Failed to download results",
        variant: "destructive",
      });
    }
  };

  // Sidebar navigation links with icons
  const navLinks: NavLink[] = [
    { label: 'Query Editor', tab: 'editor', icon: LayoutDashboard },
    { label: 'History', tab: 'history', icon: History },
    { label: 'Schema', tab: 'schema', icon: Database },
    { label: 'Settings', tab: 'settings', icon: Settings },
  ];

  const handleTabClick = (tab: string | undefined) => {
    if (tab) {
      setActiveTab(tab);
    }
  };

  const formatDate = (dateString: string) => {
    try {
      if (!dateString) return 'N/A';
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'Invalid Date';
      return new Intl.DateTimeFormat('en-US', {
        dateStyle: 'medium',
        timeStyle: 'short'
      }).format(date);
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'Invalid Date';
    }
  };

  return (
    <div className="flex min-h-screen bg-background text-foreground overflow-x-hidden">
      {/* Sidebar */}
      <aside className="fixed top-0 left-0 h-screen w-64 bg-card border-r flex flex-col overflow-y-auto">
        <div className="p-6 border-b">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-700 to-blue-500 bg-clip-text text-transparent">
            SQL Explorer
          </h1>
        </div>
        <nav className="flex-1 px-4 py-4 space-y-1">
          {navLinks.map((link) => {
            const Icon = link.icon;
            return (
            <button
                key={link.label}
                onClick={() => handleTabClick(link.tab)}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-accent transition-colors w-full ${
                  activeTab === link.tab ? 'bg-accent' : ''
                }`}
              >
                <Icon className="w-5 h-5 flex-shrink-0" />
                <span className="truncate">{link.label}</span>
            </button>
            );
          })}
        </nav>
        <div className="p-4 space-y-2 border-t bg-muted/50">
          <Button
            variant="ghost"
            className="w-full flex items-center gap-2 justify-start"
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          >
            {theme === 'dark' ? <Sun className="w-5 h-5 flex-shrink-0" /> : <Moon className="w-5 h-5 flex-shrink-0" />}
            <span className="truncate">{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
          </Button>
          <Button
            variant="ghost"
            className="w-full flex items-center gap-2 justify-start text-destructive hover:text-destructive/90 hover:bg-destructive/10"
            onClick={logout}
            >
            <LogOut className="w-5 h-5 flex-shrink-0" />
            <span className="truncate">Sign Out</span>
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 ml-64 p-8 overflow-x-hidden">
        <header className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">{navLinks.find(link => link.tab === activeTab)?.label || 'Dashboard'}</h1>
            <p className="text-muted-foreground">Welcome back, {user?.username}</p>
          </div>
          <div className="flex items-center gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-green-500"></div>
                  <span className="text-sm">Connected</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </header>

        {/* Main Content Area */}
        <div className="space-y-6">
          {activeTab === 'editor' && (
            <Card>
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h2 className="text-lg font-semibold">Query Editor</h2>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          navigator.clipboard.writeText(query);
                          toast({
                            title: "Copied!",
                            description: "Query copied to clipboard",
                          });
                        }}
                        className="flex items-center gap-2"
                      >
                        <Copy className="w-4 h-4" />
                        Copy
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setQuery('');
                          toast({
                            title: "Cleared!",
                            description: "Query editor cleared",
                          });
                        }}
                        className="flex items-center gap-2"
                      >
                        <Trash2 className="w-4 h-4" />
                        Clear
                      </Button>
                    </div>
                  </div>

                  <Tabs value={activeEditorTab} onValueChange={setActiveEditorTab} className="w-full">
                    <TabsList className="mb-4">
                      <TabsTrigger value="editor">Editor</TabsTrigger>
                      <TabsTrigger value="results">Results</TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="editor" className="space-y-4">
                      <div className="relative">
                        <QueryEditor
                          query={query}
                          setQuery={setQuery}
                          executeQuery={executeQuery}
                          loading={loading}
                          theme={theme === 'dark' ? 'vs-dark' : 'light'}
                        />
                        <div className="absolute bottom-4 right-4 flex items-center gap-2">
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={executeQuery}
                            disabled={loading || !query.trim()}
                            className="flex items-center gap-2"
                          >
                            {loading ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Play className="w-4 h-4" />
                            )}
                            {loading ? 'Running...' : 'Run Query'}
                          </Button>
                        </div>
                      </div>
                    </TabsContent>

                    <TabsContent value="results">
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <h3 className="text-sm font-medium text-muted-foreground">
                            {results.length > 0 
                              ? `${results.length} row${results.length === 1 ? '' : 's'} returned`
                              : 'No results to display'}
                          </h3>
                          {results.length > 0 && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                const csv = results.map(row => 
                                  Object.values(row).join(',')
                                ).join('\n');
                                navigator.clipboard.writeText(csv);
                                toast({
                                  title: "Copied!",
                                  description: "Results copied to clipboard",
                                });
                              }}
                              className="flex items-center gap-2"
                            >
                              <Copy className="w-4 h-4" />
                              Copy Results
                            </Button>
                          )}
                        </div>
                        <div className="rounded-md border">
                          <QueryResults results={results} loading={loading} />
                        </div>
                      </div>
                    </TabsContent>
                  </Tabs>

                  {loading && (
                    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50">
                      <div className="flex flex-col items-center gap-4">
                        <Loader2 className="w-8 h-8 animate-spin text-primary" />
                        <p className="text-lg font-medium">Executing query...</p>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {activeTab === 'history' && (
            <Card>
              <CardContent className="p-6">
                {historyLoading ? (
                  <div className="flex items-center justify-center h-32">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  </div>
                ) : history.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No query history found
                  </div>
                ) : (
                  <div className="space-y-4">
                    {history.map((item: QueryHistoryItem) => (
                      <Card key={item.id} className="bg-card">
                        <CardContent className="p-4">
                          <div className="flex flex-wrap items-start justify-between gap-4">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-2">
                                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                  <Clock className="w-4 h-4 flex-shrink-0" />
                                  {formatDate(item.created_at)}
                                </div>
                              </div>
                              <pre className="text-sm bg-muted p-3 rounded-lg overflow-x-auto whitespace-pre-wrap break-words">
                                {item.query_text}
                              </pre>
                            </div>
                            <div className="flex items-center gap-2 flex-shrink-0">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => {
                                  setQuery(item.query_text);
                                  setActiveTab('editor');
                                }}
                                className="text-muted-foreground hover:text-primary"
                              >
                                <Play className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => downloadResults(item.id)}
                                className="text-muted-foreground"
                              >
                                <Download className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => deleteQuery(item.id)}
                                className="text-destructive"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {activeTab === 'schema' && (
            <Card>
              <CardContent className="p-6">
                <SchemaExplorer
                  tables={tables}
                  selectedTable={selectedTable}
                  tableSchema={tableSchema}
                  loading={schemaLoading}
                  onSelectTable={fetchTableSchema}
                />
              </CardContent>
            </Card>
          )}

          {activeTab === 'settings' && (
            <Card>
              <CardContent className="p-6">
                <Settings />
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
};

export default Dashboard;