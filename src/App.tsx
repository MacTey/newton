import { useEffect, useState } from 'react';
import { Routes, Route, NavLink } from 'react-router-dom';
import { api } from './api/client';
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

interface AttributeValue {
  attribute_name: string;
  attribute_value: string;
  value_position: number;
  is_multi_valued: boolean;
}

interface EmployeeSnapshot {
  employee_id: string;
  first_name: string;
  last_name: string;
  job_title: string;
  email: string;
  phone: string | null;
  hire_date: string;
  salary: number;
  status: string;
  manager_id: string | null;
  source_system: string;
  attributes: AttributeValue[];
  [key: string]: unknown;
}

function groupAttributes(attrs: AttributeValue[]): { name: string; values: string[]; isMulti: boolean }[] {
  const map = new Map<string, { values: string[]; isMulti: boolean }>();
  for (const attr of attrs) {
    if (!map.has(attr.attribute_name)) {
      map.set(attr.attribute_name, { values: [], isMulti: attr.is_multi_valued });
    }
    map.get(attr.attribute_name)!.values.push(attr.attribute_value);
  }
  return Array.from(map.entries()).map(([name, { values, isMulti }]) => ({ name, values, isMulti }));
}


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
      ? 'bg-forest-100 text-forest-700 font-semibold'
      : 'text-gray-600 hover:bg-sand-200'
  }`;

const INPUT_CLASS =
  'w-full rounded-md border border-sand-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-forest-600';

const INLINE_INPUT_CLASS =
  'w-full rounded border border-sand-300 bg-white px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-forest-600';

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

  return (
    <div className="flex flex-1 max-w-7xl mx-auto w-full px-6 py-8 gap-6">

      {/* Employee List */}
      <div className="w-72 shrink-0">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-800">Employees</h2>
          <button
            onClick={openAddModal}
            className="text-xs px-2.5 py-1 rounded-md bg-forest-600 text-white hover:bg-forest-700 transition-colors"
          >
            + Add
          </button>
        </div>

        {listLoading && <p className="text-gray-500 text-sm">Loading...</p>}

        {listError && (
          <div className="bg-red-50 border border-red-200 text-red-800 rounded-lg px-4 py-3 text-sm">
            {listError}
          </div>
        )}

        {!listLoading && !listError && employees.length === 0 && (
          <p className="text-gray-500 text-sm">No employees found.</p>
        )}

        {employees.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm border border-sand-200 overflow-hidden">
            <ul className="divide-y divide-sand-100 text-sm">
              {employees.map((emp) => (
                <li key={emp.employeeId}>
                  <button
                    onClick={() => handleSelect(emp)}
                    className={`w-full text-left px-4 py-3 cursor-pointer transition-colors
                      ${selectedId === emp.employeeId
                        ? 'bg-forest-100 text-forest-800 font-semibold'
                        : 'hover:bg-sand-50'
                      }`}
                  >
                    <span className="text-gray-400 mr-2 text-xs">{emp.employeeId}</span>
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
          <div className="h-full flex items-center justify-center text-gray-400 text-sm">
            Select an employee to view details
          </div>
        )}

        {detailLoading && (
          <p className="text-gray-500 text-sm mt-4">Loading...</p>
        )}

        {detailError && (
          <div className="bg-red-50 border border-red-200 text-red-800 rounded-lg px-5 py-4 text-sm">
            {detailError}
          </div>
        )}

        {snapshot && (
          <div className="space-y-6">
            {/* Name + edit controls */}
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-2xl font-semibold text-gray-900">
                  {snapshot.first_name} {snapshot.last_name}
                </h2>
                <p className="text-gray-500 text-sm mt-1">{snapshot.job_title}</p>
              </div>
              <div className="flex items-center gap-2 shrink-0 mt-1">
                {editMode ? (
                  <>
                    <button
                      onClick={saveEdit}
                      disabled={editSaving}
                      className="text-sm px-3 py-1.5 rounded-md bg-forest-600 text-white hover:bg-forest-700 transition-colors disabled:opacity-50"
                    >
                      {editSaving ? 'Saving…' : 'Save'}
                    </button>
                    <button
                      onClick={cancelEdit}
                      disabled={editSaving}
                      className="text-sm px-3 py-1.5 rounded-md border border-sand-300 text-gray-700 hover:bg-sand-100 transition-colors disabled:opacity-50"
                    >
                      Cancel
                    </button>
                  </>
                ) : (
                  <button
                    onClick={startEdit}
                    className="text-sm px-3 py-1.5 rounded-md border border-sand-300 text-gray-700 hover:bg-sand-100 transition-colors"
                  >
                    Edit
                  </button>
                )}
              </div>
            </div>

            {/* Edit error */}
            {editError && (
              <div className="bg-red-50 border border-red-200 text-red-800 rounded-lg px-4 py-3 text-sm whitespace-pre-line">
                {editError}
              </div>
            )}

            {/* Details card */}
            <div className="bg-white rounded-lg shadow-sm border border-sand-200 p-5 space-y-5 text-sm">

              {/* Employee ID */}
              <div>
                <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">Employee ID</p>
                <p className="font-mono text-gray-700 mt-0.5">{snapshot.employee_id}</p>
              </div>

              {/* Row 1: First Name, Last Name */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">First Name</p>
                  <div className="mt-0.5">
                    {editMode && editForm
                      ? <input type="text" value={editForm.first_name} onChange={e => handleEditFieldChange('first_name', e.target.value)} className={INLINE_INPUT_CLASS} />
                      : <p className="text-gray-900">{snapshot.first_name}</p>
                    }
                  </div>
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">Last Name</p>
                  <div className="mt-0.5">
                    {editMode && editForm
                      ? <input type="text" value={editForm.last_name} onChange={e => handleEditFieldChange('last_name', e.target.value)} className={INLINE_INPUT_CLASS} />
                      : <p className="text-gray-900">{snapshot.last_name}</p>
                    }
                  </div>
                </div>
              </div>

              {/* Row 2: Job Title, Hire Date, Status */}
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">Job Title</p>
                  <div className="mt-0.5">
                    {editMode && editForm
                      ? <input type="text" value={editForm.job_title} onChange={e => handleEditFieldChange('job_title', e.target.value)} className={INLINE_INPUT_CLASS} />
                      : <p className="text-gray-900">{snapshot.job_title}</p>
                    }
                  </div>
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">Hire Date</p>
                  <div className="mt-0.5">
                    {editMode && editForm
                      ? <input type="date" value={editForm.hire_date} onChange={e => handleEditFieldChange('hire_date', e.target.value)} className={INLINE_INPUT_CLASS} />
                      : <p className="text-gray-900">{snapshot.hire_date}</p>
                    }
                  </div>
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">Status</p>
                  <div className="mt-0.5">
                    {editMode && editForm
                      ? (
                        <select value={editForm.status} onChange={e => handleEditFieldChange('status', e.target.value)} className={INLINE_INPUT_CLASS}>
                          <option value="ACTIVE">ACTIVE</option>
                          <option value="INACTIVE">INACTIVE</option>
                        </select>
                      )
                      : <p className="text-gray-900">{snapshot.status}</p>
                    }
                  </div>
                </div>
              </div>

              {/* Row 3: Email, Phone */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">Email</p>
                  <div className="mt-0.5">
                    {editMode && editForm
                      ? <input type="text" value={editForm.email} onChange={e => handleEditFieldChange('email', e.target.value)} className={INLINE_INPUT_CLASS} />
                      : <p className="text-gray-900">{snapshot.email}</p>
                    }
                  </div>
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">Phone</p>
                  <div className="mt-0.5">
                    {editMode && editForm
                      ? <input type="text" value={editForm.phone} onChange={e => handleEditFieldChange('phone', e.target.value)} className={INLINE_INPUT_CLASS} />
                      : <p className="text-gray-900">{renderValue(snapshot.phone)}</p>
                    }
                  </div>
                </div>
              </div>

              {/* Row 4: Salary (blurred until hover) */}
              <div className="group">
                <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">Salary</p>
                <div className="mt-0.5">
                  {editMode && editForm
                    ? <input type="number" value={editForm.salary} onChange={e => handleEditFieldChange('salary', e.target.value)} className={INLINE_INPUT_CLASS} />
                    : <p className="text-gray-900 blur-sm group-hover:blur-none transition-[filter] duration-200 select-none">{renderValue(snapshot.salary)}</p>
                  }
                </div>
              </div>

            </div>

            {/* Attributes */}
            {snapshot.attributes?.length > 0 && (
              <div>
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-2">Attributes</h3>
                <div className="bg-white rounded-lg shadow-sm border border-sand-200 overflow-hidden">
                  <table className="w-full text-sm">
                    <tbody className="divide-y divide-sand-100">
                      {groupAttributes(snapshot.attributes).map(({ name, values, isMulti }) => (
                        <tr key={name} className="hover:bg-sand-50">
                          <td className="px-5 py-3 font-medium text-gray-500 w-44 capitalize">
                            {name.replace(/_/g, ' ')}
                          </td>
                          <td className="px-5 py-2">
                            {isMulti ? (
                              <div className="flex flex-wrap gap-1.5">
                                {values.map(v => (
                                  <span key={v} className="bg-forest-100 text-forest-700 text-xs px-2.5 py-0.5 rounded-full border border-forest-200">{v}</span>
                                ))}
                              </div>
                            ) : values[0]}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Add Employee Modal */}
      {addModal.open && (
        <div
          className="fixed inset-0 bg-black/40 z-40 flex items-center justify-center"
          onClick={closeAddModal}
        >
          <div
            className="bg-white rounded-xl shadow-xl w-full max-w-lg mx-4 z-50 max-h-[90vh] overflow-y-auto"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-sand-200">
              <h3 className="text-base font-semibold text-gray-900">New Employee</h3>
              <button
                onClick={closeAddModal}
                className="text-gray-400 hover:text-gray-600 text-xl leading-none"
                aria-label="Close"
              >
                &times;
              </button>
            </div>

            <div className="px-6 py-5 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    First Name <span className="text-red-500">*</span>
                  </label>
                  <input type="text" value={addModal.form.firstName}
                    onChange={e => handleAddFieldChange('firstName', e.target.value)}
                    className={INPUT_CLASS} placeholder="First name" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Last Name <span className="text-red-500">*</span>
                  </label>
                  <input type="text" value={addModal.form.lastName}
                    onChange={e => handleAddFieldChange('lastName', e.target.value)}
                    className={INPUT_CLASS} placeholder="Last name" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email <span className="text-red-500">*</span>
                  </label>
                  <input type="email" value={addModal.form.email}
                    onChange={e => handleAddFieldChange('email', e.target.value)}
                    className={INPUT_CLASS} placeholder="email@example.com" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Job Title
                  </label>
                  <input type="text" value={addModal.form.jobTitle}
                    onChange={e => handleAddFieldChange('jobTitle', e.target.value)}
                    className={INPUT_CLASS} placeholder="e.g. Engineer" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Hire Date <span className="text-red-500">*</span>
                  </label>
                  <input type="date" value={addModal.form.hireDate}
                    onChange={e => handleAddFieldChange('hireDate', e.target.value)}
                    className={INPUT_CLASS} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Salary
                  </label>
                  <input type="number" value={addModal.form.salary}
                    onChange={e => handleAddFieldChange('salary', e.target.value)}
                    className={INPUT_CLASS} placeholder="0" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Phone
                  </label>
                  <input type="text" value={addModal.form.phone}
                    onChange={e => handleAddFieldChange('phone', e.target.value)}
                    className={INPUT_CLASS} placeholder="Optional" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Manager ID
                  </label>
                  <input type="text" value={addModal.form.managerId}
                    onChange={e => handleAddFieldChange('managerId', e.target.value)}
                    className={INPUT_CLASS} placeholder="Optional" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Source System <span className="text-red-500">*</span>
                  </label>
                  <input type="text" value={addModal.form.sourceSystem}
                    onChange={e => handleAddFieldChange('sourceSystem', e.target.value)}
                    className={INPUT_CLASS} placeholder="e.g. HR" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
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
                <div className="bg-red-50 border border-red-200 text-red-800 rounded-lg px-4 py-3 text-sm whitespace-pre-line">
                  {addModal.submitError}
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3 px-6 py-4 border-t border-sand-200">
              <button onClick={closeAddModal} disabled={addModal.submitting}
                className="text-sm px-4 py-2 rounded-md border border-sand-300 text-gray-700 hover:bg-sand-100 transition-colors disabled:opacity-50">
                Cancel
              </button>
              <button onClick={submitAdd} disabled={addModal.submitting}
                className="text-sm px-4 py-2 rounded-md bg-forest-600 text-white hover:bg-forest-700 transition-colors disabled:opacity-50">
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
    <div className="min-h-screen bg-sand-100 text-gray-900 flex flex-col">
      <header className="bg-white border-b border-sand-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={logo} alt="Logo" className="h-10 w-auto" />
            <h1 className="text-xl font-bold tracking-tight text-forest-800">White Tree Talent</h1>
          </div>
          <nav className="flex items-center gap-1">
            <NavLink to="/" end className={NAV_LINK_CLASS}>
              Employees
            </NavLink>
            <NavLink to="/attributes" className={NAV_LINK_CLASS}>
              Attributes
            </NavLink>
          </nav>
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
