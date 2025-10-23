'use client';

import { useState } from 'react';

export default function UsersAPITest() {
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const testGetUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      console.log('🔍 Testing GET /api/users...');
      const response = await fetch('/api/users');
      console.log('Response status:', response.status);
      
      const data = await response.json();
      console.log('Response data:', data);
      setResult(data);
    } catch (err: any) {
      console.error('Error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const testCreateUser = async () => {
    setLoading(true);
    setError(null);
    try {
      const testData = {
        email: `test-${Date.now()}@example.com`,
        password: 'test123456',
        name: 'Test User',
        role: 'STAFF'
      };
      
      console.log('🔍 Testing POST /api/users with:', testData);
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(testData),
      });
      
      console.log('Response status:', response.status);
      const data = await response.json();
      console.log('Response data:', data);
      setResult(data);
    } catch (err: any) {
      console.error('Error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <h1 className="text-3xl font-bold mb-8">Users API Test</h1>
      
      <div className="space-y-4 mb-8">
        <button
          onClick={testGetUsers}
          disabled={loading}
          className="px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg disabled:opacity-50"
        >
          Test GET /api/users
        </button>
        
        <button
          onClick={testCreateUser}
          disabled={loading}
          className="px-6 py-3 bg-green-600 hover:bg-green-700 rounded-lg disabled:opacity-50 ml-4"
        >
          Test POST /api/users
        </button>
      </div>

      {loading && <div className="text-yellow-400">Loading...</div>}
      {error && <div className="text-red-400">Error: {error}</div>}
      
      {result && (
        <div className="bg-gray-800 p-4 rounded-lg">
          <h2 className="text-xl font-bold mb-4">Result:</h2>
          <pre className="overflow-auto">
            {JSON.stringify(result, null, 2)}
          </pre>
        </div>
      )}

      <div className="mt-8 bg-gray-800 p-4 rounded-lg">
        <h2 className="text-xl font-bold mb-4">Console Logs:</h2>
        <p className="text-sm text-gray-400">
          Check the browser console for detailed logs
        </p>
      </div>
    </div>
  );
}
