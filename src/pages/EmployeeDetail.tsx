import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../api/client';
import ThemeToggle from '../components/ThemeToggle';

interface Employee {
  employeeId: number;
  firstName: string;
  lastName: string;
  [key: string]: unknown;
}

function EmployeeDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.get<Employee>(`/api/employees/${id}`)
      .then(setEmployee)
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  }, [id]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
      <header className="bg-white dark:bg-gray-800 shadow-sm">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate(-1)}
              className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
            >
              ← Back
            </button>
            <h1 className="text-2xl font-bold tracking-tight">Newton</h1>
          </div>
          <ThemeToggle />
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-12">
        {loading && <p className="text-gray-500 dark:text-gray-400">Loading...</p>}

        {error && (
          <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700 text-red-800 dark:text-red-300 rounded-lg px-5 py-4">
            {error}
          </div>
        )}

        {employee && (
          <>
            <h2 className="text-3xl font-semibold mb-6">
              {employee.firstName} {employee.lastName}
            </h2>
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden">
              <table className="w-full text-sm">
                <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                  {Object.entries(employee).map(([key, val]) => (
                    <tr key={key} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                      <td className="px-5 py-3 font-medium text-gray-600 dark:text-gray-400 w-48 capitalize">{key}</td>
                      <td className="px-5 py-3">{String(val)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </main>
    </div>
  );
}

export default EmployeeDetail;
