import { useEffect, useState } from 'react';
import { api } from './api/client';
import ThemeToggle from './components/ThemeToggle';
import logo from './assets/logo.png';
import './App.css';

interface Employee {
  employeeId: number;
  firstName: string;
  lastName: string;
  [key: string]: unknown;
}

interface SnapshotMetadata {
  generated_at: string;
  snapshot_time: string;
}

interface EmployeeSnapshot {
  employee_id: string;
  first_name: string;
  last_name: string;
  job_title: string;
  department: string;
  status: string;
  email: string;
  phone: string | null;
  location: string;
  hire_date: string;
  salary: number;
  manager_name: string | null;
  race: string;
  skills: string[];
  certifications: string[];
  snapshot_metadata: SnapshotMetadata;
  [key: string]: unknown;
}

const EXCLUDED_KEYS = new Set(['snapshot_metadata', 'skills', 'certifications']);

function renderValue(val: unknown): string {
  if (val === null || val === undefined) return '—';
  return String(val);
}

function App() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [snapshot, setSnapshot] = useState<EmployeeSnapshot | null>(null);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [listLoading, setListLoading] = useState(true);
  const [listError, setListError] = useState<string | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);

  useEffect(() => {
    api.get<Employee[]>('/api/employees')
      .then(setEmployees)
      .catch((err: Error) => setListError(err.message))
      .finally(() => setListLoading(false));
  }, []);

  function handleSelect(emp: Employee) {
    setSnapshot(null);
    setDetailError(null);
    setSelectedId(emp.employeeId);
    setDetailLoading(true);
    api.get<EmployeeSnapshot>(`/api/employees/${emp.employeeId}/snapshot`)
      .then(setSnapshot)
      .catch((err: Error) => setDetailError(err.message))
      .finally(() => setDetailLoading(false));
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 flex flex-col">
      <header className="bg-white dark:bg-gray-800 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <img src={logo} alt="Logo" className="h-10 w-auto" />
          <h1 className="text-2xl font-bold tracking-tight">White Tree Talent</h1>
          <ThemeToggle />
        </div>
      </header>

      <div className="flex flex-1 max-w-7xl mx-auto w-full px-6 py-8 gap-6">

        {/* Employee List */}
        <div className="w-72 shrink-0">
          <h2 className="text-lg font-semibold mb-4">Employees</h2>

          {listLoading && <p className="text-gray-500 dark:text-gray-400 text-sm">Loading...</p>}

          {listError && (
            <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700 text-red-800 dark:text-red-300 rounded-lg px-4 py-3 text-sm">
              {listError}
            </div>
          )}

          {!listLoading && !listError && employees.length === 0 && (
            <p className="text-gray-500 dark:text-gray-400 text-sm">No employees found.</p>
          )}

          {employees.length > 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden">
              <ul className="divide-y divide-gray-100 dark:divide-gray-700 text-sm">
                {employees.map((emp) => (
                  <li
                    key={emp.employeeId}
                    onClick={() => handleSelect(emp)}
                    className={`px-4 py-3 cursor-pointer transition-colors
                      ${selectedId === emp.employeeId
                        ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 font-medium'
                        : 'hover:bg-gray-50 dark:hover:bg-gray-700/50'
                      }`}
                  >
                    <span className="text-gray-400 dark:text-gray-500 mr-2 text-xs">{emp.employeeId}</span>
                    {emp.firstName} {emp.lastName}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Employee Detail */}
        <div className="flex-1 min-w-0">
          {!detailLoading && !snapshot && !detailError && (
            <div className="h-full flex items-center justify-center text-gray-400 dark:text-gray-600 text-sm">
              Select an employee to view details
            </div>
          )}

          {detailLoading && (
            <p className="text-gray-500 dark:text-gray-400 text-sm mt-4">Loading...</p>
          )}

          {detailError && (
            <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700 text-red-800 dark:text-red-300 rounded-lg px-5 py-4 text-sm">
              {detailError}
            </div>
          )}

          {snapshot && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-semibold">
                  {snapshot.first_name} {snapshot.last_name}
                </h2>
                <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
                  {snapshot.job_title} &middot; {snapshot.department}
                </p>
              </div>

              {/* Field table */}
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden">
                <table className="w-full text-sm">
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                    {Object.entries(snapshot)
                      .filter(([key]) => !EXCLUDED_KEYS.has(key))
                      .map(([key, val]) => (
                        <tr key={key} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                          <td className="px-5 py-3 font-medium text-gray-500 dark:text-gray-400 w-44 capitalize">
                            {key.replace(/_/g, ' ')}
                          </td>
                          <td className="px-5 py-3">{renderValue(val)}</td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>

              {/* Skills */}
              {snapshot.skills?.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide mb-2">Skills</h3>
                  <div className="flex flex-wrap gap-2">
                    {snapshot.skills.map((s) => (
                      <span key={s} className="bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-300 text-xs px-3 py-1 rounded-full">
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Certifications */}
              {snapshot.certifications?.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide mb-2">Certifications</h3>
                  <div className="flex flex-wrap gap-2">
                    {snapshot.certifications.map((c) => (
                      <span key={c} className="bg-green-100 dark:bg-green-900/40 text-green-800 dark:text-green-300 text-xs px-3 py-1 rounded-full">
                        {c}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Snapshot metadata */}
              <p className="text-xs text-gray-400 dark:text-gray-600">
                Snapshot generated {new Date(snapshot.snapshot_metadata.generated_at).toLocaleString()}
              </p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}

export default App;
