import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Moon, Sun, LayoutDashboard, History, Database, LogOut, Download, Trash2, Clock, Play, Copy, Loader2, ChevronRight, Zap, Activity, Star, ChevronDown, Folder, FolderOpen } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Badge } from '../components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/avatar';
import QueryEditor from '../components/QueryEditor';
import { useTheme } from '../components/theme-provider';
import { useToast } from '../components/ui/use-toast';
import QueryResults from '../components/QueryResults';
import SchemaExplorer from '../components/SchemaExplorer';
import { apiService } from '../services/api';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../components/ui/dialog';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';

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
  is_favorite: boolean;
  favorite_name?: string;
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
  const [favoriteDialogOpen, setFavoriteDialogOpen] = useState(false);
  const [selectedQueryId, setSelectedQueryId] = useState<number | null>(null);
  const [favoriteName, setFavoriteName] = useState('');
  const [expandedFolders, setExpandedFolders] = useState<{ [key: string]: boolean }>({});

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

  const handleFavoriteClick = (queryId: number) => {
    setSelectedQueryId(queryId);
    setFavoriteName('');
    setFavoriteDialogOpen(true);
  };

  const handleFavoriteSubmit = async () => {
    if (!selectedQueryId) return;
    
    try {
      // First toggle the favorite status
      const toggleResponse = await apiService.toggleFavorite(selectedQueryId);
      
      // Only update the name if the toggle was successful
      if (toggleResponse) {
        await apiService.updateFavoriteName(selectedQueryId, favoriteName);
        fetchHistory();
        setFavoriteDialogOpen(false);
        toast({
          title: "Success",
          description: "Query marked as favorite",
        });
      }
    } catch (error) {
      console.error('Error updating favorite:', error);
      toast({
        title: "Error",
        description: "Failed to update favorite status",
        variant: "destructive",
      });
    }
  };

  const toggleFolder = (folderName: string) => {
    setExpandedFolders(prev => ({
      ...prev,
      [folderName]: !prev[folderName]
    }));
  };

  const getFavoriteFolders = () => {
    const folders: { [key: string]: QueryHistoryItem[] } = {};
    history
      .filter(item => item.is_favorite)
      .forEach(item => {
        const folderName = item.favorite_name || 'Unnamed';
        if (!folders[folderName]) {
          folders[folderName] = [];
        }
        folders[folderName].push(item);
      });
    return folders;
  };

  // Sidebar navigation links with icons
  const navLinks: NavLink[] = [
    { label: 'Query Editor', tab: 'editor', icon: LayoutDashboard },
    { label: 'History', tab: 'history', icon: History },
    { label: 'Favorites', tab: 'favorites', icon: Star },
    { label: 'Schema', tab: 'schema', icon: Database },
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

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-background via-background to-muted/30">
      {/* Enhanced Sidebar */}
      <aside className="fixed top-0 left-0 h-screen w-72 bg-card/95 backdrop-blur-sm border-r border-border/50 flex flex-col overflow-y-auto shadow-xl">
        {/* Header */}
        <div className="p-6 border-b border-border/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center">
              <Zap className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                SQL Analytics
              </h1>
            
            </div>
          </div>
        </div>

        {/* User Profile */}
        <div className="p-4 border-b border-border/50">
          <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
            <Avatar className="h-10 w-10 ring-2 ring-primary/20">
              <AvatarImage src="" />
              <AvatarFallback className="bg-primary text-primary-foreground font-medium">
                {getInitials(user?.username || 'User')}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm truncate">{user?.username}</p>
              <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
              {user?.lastLogin && (
                <p className="text-xs text-muted-foreground truncate">
                  Last login: {new Date(user.lastLogin).toLocaleString()}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-4 space-y-2">
          {navLinks.map((link) => {
            const Icon = link.icon;
            const isActive = activeTab === link.tab;
            return (
              <button
                key={link.label}
                onClick={() => handleTabClick(link.tab)}
                className={`group flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 w-full ${
                  isActive 
                    ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/25' 
                    : 'hover:bg-accent hover:text-accent-foreground'
                }`}
              >
                <Icon className={`w-5 h-5 transition-transform duration-200 ${isActive ? 'scale-110' : 'group-hover:scale-105'}`} />
                <span className="font-medium">{link.label}</span>
                <ChevronRight className={`w-4 h-4 ml-auto transition-transform duration-200 ${isActive ? 'rotate-90' : ''}`} />
              </button>
            );
          })}
        </nav>

        {/* Footer Actions */}
        <div className="p-4 space-y-2 border-t border-border/50 bg-muted/30">
          <Button
            variant="ghost"
            className="w-full flex items-center gap-3 justify-start text-sm"
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          >
            {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            <span>{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
          </Button>
          <Button
            variant="ghost"
            className="w-full flex items-center gap-3 justify-start text-sm text-destructive hover:text-destructive/90 hover:bg-destructive/10"
            onClick={logout}
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 ml-72 overflow-hidden">
        <div className="h-screen flex flex-col">
          {/* Enhanced Header */}
          <header className="bg-card/95 backdrop-blur-sm border-b border-border/50 px-8 py-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-3">
                  <h1 className="text-3xl font-bold bg-gradient-to-r from-foreground to-foreground/60 bg-clip-text text-transparent">
                    {navLinks.find(link => link.tab === activeTab)?.label || 'Dashboard'}
                  </h1>
                  {activeTab === 'editor' && (
                    <Badge variant="outline" className="flex items-center gap-1">
                      <Activity className="w-3 h-3" />
                      Live
                    </Badge>
                  )}
                </div>
                <p className="text-muted-foreground mt-1">
                  Welcome , <span className="font-medium">{user?.username}</span>
                </p>
              </div>
              <div className="flex items-center gap-4">
                <Card className="px-4 py-2">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                    <span className="text-sm font-medium">Connected</span>
                  </div>
                </Card>
              </div>
            </div>
          </header>

          {/* Content Area */}
          <div className="flex-1 p-8 overflow-auto">
            {activeTab === 'editor' && (
              <div className="space-y-6">
                <Card className="relative overflow-hidden shadow-lg border-0 bg-gradient-to-br from-card to-card/50">
                  <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-secondary/5" />
                  <CardHeader className="relative border-b border-border/50">
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center gap-2 text-xl">
                        <LayoutDashboard className="w-5 h-5" />
                        SQL Query Editor
                      </CardTitle>
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
                  </CardHeader>

                  <CardContent className="relative p-6">
                    <Tabs value={activeEditorTab} onValueChange={setActiveEditorTab} className="w-full">
                      <TabsList className="mb-6 bg-muted/50">
                        <TabsTrigger value="editor" className="flex items-center gap-2">
                          <LayoutDashboard className="w-4 h-4" />
                          Editor
                        </TabsTrigger>
                        <TabsTrigger value="results" className="flex items-center gap-2">
                          <Activity className="w-4 h-4" />
                          Results
                          {results.length > 0 && (
                            <Badge variant="secondary" className="ml-1 text-xs">
                              {results.length}
                            </Badge>
                          )}
                        </TabsTrigger>
                      </TabsList>
                      
                      <TabsContent value="editor" className="space-y-4">
                        <div className="relative rounded-lg overflow-hidden border border-border/50">
                          <QueryEditor
                            query={query}
                            setQuery={setQuery}
                            executeQuery={executeQuery}
                            loading={loading}
                            theme={theme === 'dark' ? 'vs-dark' : 'light'}
                          />
                          <div className="absolute bottom-4 right-4 flex items-center gap-2">
                            <Button
                              onClick={executeQuery}
                              disabled={loading || !query.trim()}
                              className="flex items-center gap-2 shadow-lg"
                            >
                              {loading ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <Play className="w-4 h-4" />
                              )}
                              {loading ? 'Running...' : 'Execute Query'}
                            </Button>
                          </div>
                        </div>
                      </TabsContent>

                      <TabsContent value="results">
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <h3 className="text-sm font-medium text-muted-foreground">
                                {results.length > 0 
                                  ? `${results.length} row${results.length === 1 ? '' : 's'} returned`
                                  : 'No results to display'}
                              </h3>
                              {results.length > 0 && (
                                <Badge variant="outline">
                                  {new Date().toLocaleTimeString()}
                                </Badge>
                              )}
                            </div>
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
                          <div className="rounded-lg border border-border/50 overflow-hidden">
                            <QueryResults results={results} loading={loading} />
                          </div>
                        </div>
                      </TabsContent>
                    </Tabs>
                  </CardContent>
                </Card>
              </div>
            )}

            {activeTab === 'history' && (
              <Card className="shadow-lg border-0 bg-gradient-to-br from-card to-card/50">
                <CardHeader className="border-b border-border/50">
                  <CardTitle className="flex items-center gap-2 text-xl">
                    <History className="w-5 h-5" />
                    Query History
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  {historyLoading ? (
                    <div className="flex items-center justify-center h-32">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                    </div>
                  ) : history.length === 0 ? (
                    <div className="text-center py-12">
                      <History className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground">No query history found</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {history.map((item: QueryHistoryItem) => (
                        <Card key={item.id} className="bg-muted/30 border-border/50 hover:bg-muted/50 transition-colors">
                          <CardContent className="p-4">
                            <div className="flex flex-wrap items-start justify-between gap-4">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-2">
                                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                    <Clock className="w-4 h-4 flex-shrink-0" />
                                    {formatDate(item.created_at)}
                                  </div>
                                  <Badge variant="outline" className="text-xs">
                                    Query #{item.id}
                                  </Badge>
                                  {item.is_favorite && (
                                    <Badge variant="secondary" className="text-xs flex items-center gap-1">
                                      <Star className="w-3 h-3" />
                                      {item.favorite_name || 'Favorite'}
                                    </Badge>
                                  )}
                                </div>
                                <pre className="text-sm text-gray-700 whitespace-pre-wrap break-words bg-gray-50 p-2 rounded border border-gray-200 mt-1">
                                  {item.query_text}
                                </pre>
                              </div>
                              <div className="flex items-center gap-1 flex-shrink-0">
                                <Button
                                  variant="ghost"
                                  size="sm"
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
                                  size="sm"
                                  onClick={() => handleFavoriteClick(item.id)}
                                  className={`${item.is_favorite ? 'text-yellow-500' : 'text-muted-foreground'} hover:text-yellow-500`}
                                >
                                  <Star className="w-4 h-4" fill={item.is_favorite ? 'currentColor' : 'none'} />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => downloadResults(item.id)}
                                  className="text-muted-foreground hover:text-primary"
                                >
                                  <Download className="w-4 h-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => deleteQuery(item.id)}
                                  className="text-destructive hover:text-destructive/90"
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

            {activeTab === 'favorites' && (
              <Card className="shadow-lg border-0 bg-gradient-to-br from-card to-card/50">
                <CardHeader className="border-b border-border/50">
                  <CardTitle className="flex items-center gap-2 text-xl">
                    <Star className="w-5 h-5" />
                    Favorite Queries
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  {historyLoading ? (
                    <div className="flex items-center justify-center h-32">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                    </div>
                  ) : history.filter(item => item.is_favorite).length === 0 ? (
                    <div className="text-center py-12">
                      <Star className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground">No favorite queries yet</p>
                      <p className="text-sm text-muted-foreground mt-2">
                        Mark queries as favorites from the history tab to see them here
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {Object.entries(getFavoriteFolders()).map(([folderName, queries]) => (
                        <div key={folderName} className="border rounded-lg overflow-hidden">
                          <button
                            onClick={() => toggleFolder(folderName)}
                            className="w-full flex items-center gap-2 p-4 bg-muted/30 hover:bg-muted/50 transition-colors"
                          >
                            {expandedFolders[folderName] ? (
                              <FolderOpen className="w-5 h-5 text-primary" />
                            ) : (
                              <Folder className="w-5 h-5 text-primary" />
                            )}
                            <span className="font-medium">{folderName}</span>
                            <Badge variant="secondary" className="ml-2">
                              {queries.length} {queries.length === 1 ? 'query' : 'queries'}
                            </Badge>
                            {expandedFolders[folderName] ? (
                              <ChevronDown className="w-4 h-4 ml-auto" />
                            ) : (
                              <ChevronRight className="w-4 h-4 ml-auto" />
                            )}
                          </button>
                          {expandedFolders[folderName] && (
                            <div className="p-4 space-y-4 bg-card">
                              {queries.map((item: QueryHistoryItem) => (
                                <Card key={item.id} className="bg-muted/30 border-border/50 hover:bg-muted/50 transition-colors">
                                  <CardContent className="p-4">
                                    <div className="flex flex-wrap items-start justify-between gap-4">
                                      <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-2">
                                          <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                            <Clock className="w-4 h-4 flex-shrink-0" />
                                            {formatDate(item.created_at)}
                                          </div>
                                          <Badge variant="outline" className="text-xs">
                                            Query #{item.id}
                                          </Badge>
                                        </div>
                                        <pre className="text-sm text-gray-700 whitespace-pre-wrap break-words bg-gray-50 p-2 rounded border border-gray-200 mt-1">
                                          {item.query_text}
                                        </pre>
                                      </div>
                                      <div className="flex items-center gap-2">
                                        <Button
                                          variant="ghost"
                                          size="sm"
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
                                          size="sm"
                                          onClick={() => handleFavoriteClick(item.id)}
                                          className="text-yellow-500 hover:text-yellow-600"
                                        >
                                          <Star className="w-4 h-4" fill="currentColor" />
                                        </Button>
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          onClick={() => downloadResults(item.id)}
                                          className="text-muted-foreground hover:text-primary"
                                        >
                                          <Download className="w-4 h-4" />
                                        </Button>
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          onClick={() => deleteQuery(item.id)}
                                          className="text-destructive hover:text-destructive/90"
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
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {activeTab === 'schema' && (
              <Card className="shadow-lg border-0 bg-gradient-to-br from-card to-card/50">
                <CardHeader className="border-b border-border/50">
                  <CardTitle className="flex items-center gap-2 text-xl">
                    <Database className="w-5 h-5" />
                    Database Schema
                  </CardTitle>
                </CardHeader>
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
          </div>
        </div>

        {/* Loading Overlay */}
        {loading && (
          <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50">
            <Card className="p-6">
              <div className="flex flex-col items-center gap-4">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
                <p className="text-lg font-medium">Executing query...</p>
                <p className="text-sm text-muted-foreground">Please wait while we process your request</p>
              </div>
            </Card>
          </div>
        )}
      </main>

      <Dialog open={favoriteDialogOpen} onOpenChange={setFavoriteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Name Your Favorite Query</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <Label htmlFor="favoriteName">Favorite Name</Label>
            <Input
              id="favoriteName"
              value={favoriteName}
              onChange={(e) => setFavoriteName(e.target.value)}
              placeholder="Enter a name for this favorite query"
              className="mt-2"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setFavoriteDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleFavoriteSubmit}>
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Dashboard;