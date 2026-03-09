import './App.css';

function App() {
  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <header className="bg-white shadow-sm">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold tracking-tight">Newton</h1>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-12">
        <div className="text-center">
          <h2 className="text-4xl font-semibold mb-4">Welcome to Newton</h2>
          <p className="text-gray-500 text-lg mb-8">
            Your React application is ready. Connect it to your Java API to get started.
          </p>
          <div className="inline-block bg-blue-50 border border-blue-200 rounded-lg px-6 py-4 text-left text-sm text-blue-800">
            <p className="font-medium mb-1">Next step</p>
            <p>
              Set <code className="bg-blue-100 rounded px-1">VITE_API_BASE_URL</code> in a{' '}
              <code className="bg-blue-100 rounded px-1">.env.local</code> file to point to your
              Java API (default:{' '}
              <code className="bg-blue-100 rounded px-1">http://localhost:8080</code>).
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;
