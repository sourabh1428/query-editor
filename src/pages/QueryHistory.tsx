import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { useToast } from '../components/ui/use-toast';
import { API_URL } from '../config';

interface Query {
  id: number;
  query: string;
  executed_at: string;
  status: string;
}

const QueryHistory = () => {
  const [queries, setQueries] = useState<Query[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    const fetchQueries = async () => {
      try {
        const response = await fetch(`${API_URL}/queries/history`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
          },
          credentials: 'include',
        });

        if (!response.ok) {
          throw new Error('Failed to fetch query history');
        }

        const data = await response.json();
        setQueries(data);
      } catch (error) {
        toast({
          title: 'Error',
          description: 'Failed to load query history',
          variant: 'destructive',
        });
      }
    };

    fetchQueries();
  }, [toast]);

  return (
    <div className="container mx-auto p-4">
      <Card>
        <CardHeader>
          <CardTitle>Query History</CardTitle>
        </CardHeader>
        <CardContent>
          {queries.length === 0 ? (
            <p className="text-center text-gray-500">No queries found</p>
          ) : (
            <div className="space-y-4">
              {queries.map((query) => (
                <div key={query.id} className="border rounded-lg p-4">
                  <p className="font-mono text-sm">{query.query}</p>
                  <div className="mt-2 text-sm text-gray-500">
                    <span>Executed: {new Date(query.executed_at).toLocaleString()}</span>
                    <span className="ml-4">Status: {query.status}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default QueryHistory; 