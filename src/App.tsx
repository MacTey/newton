import { useEffect, useState } from 'react';
import { Routes, Route, NavLink } from 'react-router-dom';
import { api } from './api/client';
import ThemeToggle from './components/ThemeToggle';
import AttributeEditor from './pages/AttributeEditor';
import logo from './assets/logo.png';
import './App.css';

interface Employee {
  employeeId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  jobTitle: string;
  managerId: string | null;
  hireDate: string;
  salary: number;
  status: string;
  sourceSystem: string;
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
  manager_id: string | null;
  manager_name: string | null;
  race: string;
  skills: string[];
  certifications: string[];
  snapshot_metadata: SnapshotMetadata;
  [key: string]: unknown;
}

const EXCLUDED_KEYS = new Set(['snapshot_metadata', 'skills', 'certifications']);

// Fields editable in-place → camelCase key for PUT payload
const EDITABLE_FIELDS: Record<string, string> = {
  first_name: 'firstName',
  last_name: 'lastName',
  email: 'email',
  phone: 'phone',
  job_title: 'jobTitle',
  hire_date: 'hireDate',
  salary: 'salary',
  status: 'status',
  manager_id: 'managerId',
};

type EditFormState = {
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  job_title: string;
  hire_date: string;
  salary: string;
  status: string;
  manager_id: string;
};

// Add modal
type AddFormState = {
  firstName: string;
  lastName: string;
  email: string;
  jobTitle: string;
  phone: string;
  managerId: string;
  hireDate: string;
  salary: string;
  status: string;
  sourceSystem: string;
};

const EMPTY_ADD_FORM: AddFormState = {
  firstName: '', lastName: '', email: '', jobTitle: '',
  phone: '', managerId: '', hireDate: '', salary: '', status: 'ACTIVE', sourceSystem: '',
};

interface AddModalState {
  open: boolean;
  form: AddFormState;
  submitError: string | null;
  submitting: boolean;
}

const CLOSED_ADD_MODAL: AddModalState = {
  open: false, form: EMPTY_ADD_FORM, submitError: null, submitting: false,
};

export function renderValue(val: unknown): string {
  if (val === null || val === undefined) return '—';
  return String(val);
}

const NAV_LINK_CLASS = ({ isActive }: { isActive: boolean }) =>
  `text-sm px-3 py-1.5 rounded-md transition-colors ${
    isActive
      ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 font-medium'
      : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
  }`;

const INPUT_CLASS =
  'w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400';

const INLINE_INPUT_CLASS =
  'w-full rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 dark:focus:ring-blue-400';

function validateAdd(form: AddFormState): string | null {
  if (!form.firstName.trim()) return 'First name is required.';
  if (!form.lastName.trim()) return 'Last name is required.';
  if (!form.email.trim()) return 'Email is required.';
  if (!form.hireDate.trim()) return 'Hire date is required.';
  if (!form.sourceSystem.trim()) return 'Source system is required.';
  return null;
}

function validateEdit(form: EditFormState): string | null {
  if (!form.first_name.trim()) return 'First name is required.';
  if (!form.last_name.trim()) return 'Last name is required.';
  if (!form.email.trim()) return 'Email is required.';
  if (!form.hire_date.trim()) return 'Hire date is required.';
  return null;
}

function EmployeeView() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [snapshot, setSnapshot] = useState<EmployeeSnapshot | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [listLoading, setListLoading] = useState(true);
  const [listError, setListError] = useState<string | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);

  // In-place edit state
  const [editMode, setEditMode] = useState(false);
  const [editForm, setEditForm] = useState<EditFormState | null>(null);
  const [editInitial, setEditInitial] = useState<EditFormState | null>(null);
  const [editError, setEditError] = useState<string | null>(null);
  const [editSaving, setEditSaving] = useState(false);

  // Add modal state
  const [addModal, setAddModal] = useState<AddModalState>(CLOSED_ADD_MODAL);

  function loadEmployees() {
    setListLoading(true);
    setListError(null);
    api.get<Employee[]>('/api/employees')
      .then(setEmployees)
      .catch((err: Error) => setListError(err.message))
      .finally(() => setListLoading(false));
  }

  useEffect(() => {
    loadEmployees();
  }, []);

  // Scroll-lock when add modal is open
  useEffect(() => {
    document.body.style.overflow = addModal.open ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [addModal.open]);

  function hasChanges(): boolean {
    if (!editForm || !editInitial) return false;
    return (Object.keys(editForm) as (keyof EditFormState)[]).some(
      k => editForm[k] !== editInitial[k]
    );
  }

  function handleSelect(emp: Employee) {
    if (editMode && hasChanges()) {
      if (!window.confirm('You have unsaved changes. Discard them?')) return;
    }
    setEditMode(false);
    setEditForm(null);
    setEditInitial(null);
    setEditError(null);
    setSnapshot(null);
    setDetailError(null);
    setSelectedId(emp.employeeId);
    setDetailLoading(true);
    api.get<EmployeeSnapshot>(`/api/employees/${emp.employeeId}/snapshot`)
      .then(setSnapshot)
      .catch((err: Error) => setDetailError(err.message))
      .finally(() => setDetailLoading(false));
  }

  function startEdit() {
    if (!snapshot) return;
    const form: EditFormState = {
      first_name: snapshot.first_name,
      last_name: snapshot.last_name,
      email: snapshot.email,
      phone: snapshot.phone ?? '',
      job_title: snapshot.job_title,
      hire_date: snapshot.hire_date,
      salary: String(snapshot.salary),
      status: snapshot.status,
      manager_id: snapshot.manager_id ?? '',
    };
    setEditForm(form);
    setEditInitial(form);
    setEditMode(true);
    setEditError(null);
  }

  function cancelEdit() {
    setEditMode(false);
    setEditForm(null);
    setEditInitial(null);
    setEditError(null);
  }

  function handleEditFieldChange(field: keyof EditFormState, value: string) {
    setEditForm(prev => prev ? { ...prev, [field]: value } : prev);
  }

  async function saveEdit() {
    if (!editForm || !selectedId) return;
    const validationError = validateEdit(editForm);
    if (validationError) { setEditError(validationError); return; }

    const sourceSystem = employees.find(e => e.employeeId === selectedId)?.sourceSystem ?? '';
    const payload = {
      firstName: editForm.first_name.trim(),
      lastName: editForm.last_name.trim(),
      email: editForm.email.trim(),
      phone: editForm.phone.trim() || null,
      jobTitle: editForm.job_title.trim(),
      hireDate: editForm.hire_date,
      salary: parseFloat(editForm.salary) || 0,
      status: editForm.status,
      managerId: editForm.manager_id.trim() || null,
      sourceSystem,
    };

    setEditSaving(true);
    setEditError(null);
    try {
      await api.put(`/api/employees/${selectedId}`, payload);
      setEditMode(false);
      setEditForm(null);
      setEditInitial(null);
      loadEmployees();
      // Re-fetch snapshot to reflect saved changes
      setDetailLoading(true);
      api.get<EmployeeSnapshot>(`/api/employees/${selectedId}/snapshot`)
        .then(setSnapshot)
        .catch((err: Error) => setDetailError(err.message))
        .finally(() => setDetailLoading(false));
    } catch (err) {
      setEditError(err instanceof Error ? err.message : 'An error occurred.');
    } finally {
      setEditSaving(false);
    }
  }

  // Add modal handlers
  function openAddModal() {
    setAddModal({ open: true, form: EMPTY_ADD_FORM, submitError: null, submitting: false });
  }

  function closeAddModal() {
    setAddModal(prev => ({ ...prev, open: false }));
  }

  function handleAddFieldChange(field: keyof AddFormState, value: string) {
    setAddModal(prev => ({ ...prev, form: { ...prev.form, [field]: value } }));
  }

  async function submitAdd() {
    const validationError = validateAdd(addModal.form);
    if (validationError) {
      setAddModal(prev => ({ ...prev, submitError: validationError }));
      return;
    }
    const payload = {
      firstName: addModal.form.firstName.trim(),
      lastName: addModal.form.lastName.trim(),
      email: addModal.form.email.trim(),
      phone: addModal.form.phone.trim() || null,
      jobTitle: addModal.form.jobTitle.trim(),
      hireDate: addModal.form.hireDate,
      salary: parseFloat(addModal.form.salary) || 0,
      status: addModal.form.status,
      managerId: addModal.form.managerId.trim() || null,
      sourceSystem: addModal.form.sourceSystem.trim(),
    };
    setAddModal(prev => ({ ...prev, submitting: true, submitError: null }));
    try {
      await api.post('/api/employees', payload);
      closeAddModal();
      loadEmployees();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'An error occurred.';
      setAddModal(prev => ({ ...prev, submitting: false, submitError: message }));
    }
  }

  function renderFieldValue(key: string, val: unknown) {
    if (!editMode || !(key in EDITABLE_FIELDS) || !editForm) {
      return renderValue(val);
    }
    const formKey = key as keyof EditFormState;
    const value = editForm[formKey];
    if (key === 'status') {
      return (
        <select value={value} onChange={e => handleEditFieldChange(formKey, e.target.value)} className={INLINE_INPUT_CLASS}>
          <option value="ACTIVE">ACTIVE</option>
          <option value="INACTIVE">INACTIVE</option>
        </select>
      );
    }
    return (
      <input
        type={key === 'hire_date' ? 'date' : key === 'salary' ? 'number' : 'text'}
        value={value}
        onChange={e => handleEditFieldChange(formKey, e.target.value)}
        className={INLINE_INPUT_CLASS}
      />
    );
  }

  return (
    <div className="flex flex-1 max-w-7xl mx-auto w-full px-6 py-8 gap-6">

      {/* Employee List */}
      <div className="w-72 shrink-0">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Employees</h2>
          <button
            onClick={openAddModal}
            className="text-xs px-2.5 py-1 rounded-md bg-blue-600 text-white hover:bg-blue-700 transition-colors"
          >
            + Add
          </button>
        </div>

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
                <li key={emp.employeeId}>
                  <button
                    onClick={() => handleSelect(emp)}
                    className={`w-full text-left px-4 py-3 cursor-pointer transition-colors
                      ${selectedId === emp.employeeId
                        ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 font-medium'
                        : 'hover:bg-gray-50 dark:hover:bg-gray-700/50'
                      }`}
                  >
                    <span className="text-gray-400 dark:text-gray-500 mr-2 text-xs">{emp.employeeId}</span>
                    {emp.firstName} {emp.lastName}
                  </button>
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
            {/* Name + edit controls */}
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-2xl font-semibold">
                  {snapshot.first_name} {snapshot.last_name}
                </h2>
                <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
                  {snapshot.job_title} &middot; {snapshot.department}
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0 mt-1">
                {editMode ? (
                  <>
                    <button
                      onClick={saveEdit}
                      disabled={editSaving}
                      className="text-sm px-3 py-1.5 rounded-md bg-blue-600 text-white hover:bg-blue-700 transition-colors disabled:opacity-50"
                    >
                      {editSaving ? 'Saving…' : 'Save'}
                    </button>
                    <button
                      onClick={cancelEdit}
                      disabled={editSaving}
                      className="text-sm px-3 py-1.5 rounded-md border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
                    >
                      Cancel
                    </button>
                  </>
                ) : (
                  <button
                    onClick={startEdit}
                    className="text-sm px-3 py-1.5 rounded-md border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  >
                    Edit
                  </button>
                )}
              </div>
            </div>

            {/* Edit error */}
            {editError && (
              <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700 text-red-800 dark:text-red-300 rounded-lg px-4 py-3 text-sm whitespace-pre-line">
                {editError}
              </div>
            )}

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
                        <td className="px-5 py-2">
                          {renderFieldValue(key, val)}
                        </td>
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

      {/* Add Employee Modal */}
      {addModal.open && (
        <div
          className="fixed inset-0 bg-black/40 dark:bg-black/60 z-40 flex items-center justify-center"
          onClick={closeAddModal}
        >
          <div
            className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-lg mx-4 z-50 max-h-[90vh] overflow-y-auto"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-700">
              <h3 className="text-base font-semibold">New Employee</h3>
              <button
                onClick={closeAddModal}
                className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 text-xl leading-none"
                aria-label="Close"
              >
                &times;
              </button>
            </div>

            <div className="px-6 py-5 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    First Name <span className="text-red-500">*</span>
                  </label>
                  <input type="text" value={addModal.form.firstName}
                    onChange={e => handleAddFieldChange('firstName', e.target.value)}
                    className={INPUT_CLASS} placeholder="First name" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Last Name <span className="text-red-500">*</span>
                  </label>
                  <input type="text" value={addModal.form.lastName}
                    onChange={e => handleAddFieldChange('lastName', e.target.value)}
                    className={INPUT_CLASS} placeholder="Last name" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Email <span className="text-red-500">*</span>
                  </label>
                  <input type="email" value={addModal.form.email}
                    onChange={e => handleAddFieldChange('email', e.target.value)}
                    className={INPUT_CLASS} placeholder="email@example.com" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Job Title
                  </label>
                  <input type="text" value={addModal.form.jobTitle}
                    onChange={e => handleAddFieldChange('jobTitle', e.target.value)}
                    className={INPUT_CLASS} placeholder="e.g. Engineer" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Hire Date <span className="text-red-500">*</span>
                  </label>
                  <input type="date" value={addModal.form.hireDate}
                    onChange={e => handleAddFieldChange('hireDate', e.target.value)}
                    className={INPUT_CLASS} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Salary
                  </label>
                  <input type="number" value={addModal.form.salary}
                    onChange={e => handleAddFieldChange('salary', e.target.value)}
                    className={INPUT_CLASS} placeholder="0" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Phone
                  </label>
                  <input type="text" value={addModal.form.phone}
                    onChange={e => handleAddFieldChange('phone', e.target.value)}
                    className={INPUT_CLASS} placeholder="Optional" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Manager ID
                  </label>
                  <input type="text" value={addModal.form.managerId}
                    onChange={e => handleAddFieldChange('managerId', e.target.value)}
                    className={INPUT_CLASS} placeholder="Optional" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Source System <span className="text-red-500">*</span>
                  </label>
                  <input type="text" value={addModal.form.sourceSystem}
                    onChange={e => handleAddFieldChange('sourceSystem', e.target.value)}
                    className={INPUT_CLASS} placeholder="e.g. HR" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Status
                  </label>
                  <select value={addModal.form.status}
                    onChange={e => handleAddFieldChange('status', e.target.value)}
                    className={INPUT_CLASS}>
                    <option value="ACTIVE">ACTIVE</option>
                    <option value="INACTIVE">INACTIVE</option>
                  </select>
                </div>
              </div>

              {addModal.submitError && (
                <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700 text-red-800 dark:text-red-300 rounded-lg px-4 py-3 text-sm whitespace-pre-line">
                  {addModal.submitError}
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-100 dark:border-gray-700">
              <button onClick={closeAddModal} disabled={addModal.submitting}
                className="text-sm px-4 py-2 rounded-md border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors disabled:opacity-50">
                Cancel
              </button>
              <button onClick={submitAdd} disabled={addModal.submitting}
                className="text-sm px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700 transition-colors disabled:opacity-50">
                {addModal.submitting ? 'Saving…' : 'Add Employee'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function App() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 flex flex-col">
      <header className="bg-white dark:bg-gray-800 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <img src={logo} alt="Logo" className="h-10 w-auto" />
          <h1 className="text-2xl font-bold tracking-tight">White Tree Talent</h1>
          <div className="flex items-center gap-4">
            <nav className="flex items-center gap-1">
              <NavLink to="/" end className={NAV_LINK_CLASS}>
                Employees
              </NavLink>
              <NavLink to="/attributes" className={NAV_LINK_CLASS}>
                Attributes
              </NavLink>
            </nav>
            <ThemeToggle />
          </div>
        </div>
      </header>

      <Routes>
        <Route path="/" element={<EmployeeView />} />
        <Route path="/attributes" element={<AttributeEditor />} />
      </Routes>
    </div>
  );
}

export default App;
