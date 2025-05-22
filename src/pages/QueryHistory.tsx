import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { useToast } from '../components/ui/use-toast';

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
        const response = await fetch('http://localhost:5000/api/queries/history', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
          },
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
          <div className="space-y-4">
            {queries.map((query) => (
              <Card key={query.id}>
                <CardContent className="p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium">{query.query}</p>
                      <p className="text-sm text-gray-500">
                        Executed at: {new Date(query.executed_at).toLocaleString()}
                      </p>
                    </div>
                    <span
                      className={`px-2 py-1 rounded text-sm ${
                        query.status === 'success'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {query.status}
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
            {queries.length === 0 && (
              <p className="text-center text-gray-500">No queries found</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default QueryHistory; 