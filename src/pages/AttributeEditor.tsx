import { useEffect, useState } from 'react';
import { api } from '../api/client';

interface AttributeDefinition {
  name: string;
  label: string;
  type: string;
  required: boolean;
  description: string;
}

type FormState = {
  name: string;
  label: string;
  type: string;
  required: string;
  description: string;
};

const EMPTY_FORM: FormState = {
  name: '',
  label: '',
  type: 'text',
  required: 'false',
  description: '',
};

interface ModalState {
  open: boolean;
  mode: 'add' | 'edit';
  editingName: string | null;
  form: FormState;
  submitError: string | null;
  submitting: boolean;
}

const CLOSED_MODAL: ModalState = {
  open: false,
  mode: 'add',
  editingName: null,
  form: EMPTY_FORM,
  submitError: null,
  submitting: false,
};

function validate(form: FormState): string | null {
  if (!form.name.trim()) return 'Name is required.';
  if (!form.label.trim()) return 'Label is required.';
  if (!form.type.trim()) return 'Type is required.';
  return null;
}

const INPUT_CLASS =
  'w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400';

export default function AttributeEditor() {
  const [attrs, setAttrs] = useState<AttributeDefinition[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modal, setModal] = useState<ModalState>(CLOSED_MODAL);

  function loadAttrs() {
    setLoading(true);
    setError(null);
    api.get<AttributeDefinition[]>('/api/attribute-definitions')
      .then(setAttrs)
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    loadAttrs();
  }, []);

  useEffect(() => {
    if (modal.open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [modal.open]);

  function openAdd() {
    setModal({ open: true, mode: 'add', editingName: null, form: EMPTY_FORM, submitError: null, submitting: false });
  }

  function openEdit(attr: AttributeDefinition) {
    setModal({
      open: true,
      mode: 'edit',
      editingName: attr.name,
      form: {
        name: attr.name,
        label: attr.label,
        type: attr.type,
        required: String(attr.required),
        description: attr.description ?? '',
      },
      submitError: null,
      submitting: false,
    });
  }

  function closeModal() {
    setModal((prev) => ({ ...prev, open: false }));
  }

  function handleFieldChange(field: keyof FormState, value: string) {
    setModal((prev) => ({ ...prev, form: { ...prev.form, [field]: value } }));
  }

  async function handleSubmit() {
    const validationError = validate(modal.form);
    if (validationError) {
      setModal((prev) => ({ ...prev, submitError: validationError }));
      return;
    }

    const payload = {
      name: modal.form.name.trim(),
      label: modal.form.label.trim(),
      type: modal.form.type.trim(),
      required: modal.form.required === 'true',
      description: modal.form.description.trim(),
    };

    setModal((prev) => ({ ...prev, submitting: true, submitError: null }));

    try {
      if (modal.mode === 'add') {
        await api.post('/api/attribute-definitions', payload);
      } else {
        await api.put(`/api/attribute-definitions/${modal.editingName}`, payload);
      }
      closeModal();
      loadAttrs();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'An error occurred.';
      setModal((prev) => ({ ...prev, submitting: false, submitError: message }));
    }
  }

  return (
    <div className="flex-1 max-w-7xl mx-auto w-full px-6 py-8">

      {/* Page header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold">Attribute Definitions</h2>
        <button
          onClick={openAdd}
          className="text-sm px-3 py-1.5 rounded-md bg-blue-600 text-white hover:bg-blue-700 transition-colors"
        >
          + Add Attribute
        </button>
      </div>

      {loading && <p className="text-gray-500 dark:text-gray-400 text-sm">Loading...</p>}

      {error && (
        <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700 text-red-800 dark:text-red-300 rounded-lg px-4 py-3 text-sm">
          {error}
        </div>
      )}

      {!loading && !error && attrs.length === 0 && (
        <p className="text-gray-500 dark:text-gray-400 text-sm">No attribute definitions found.</p>
      )}

      {attrs.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 dark:border-gray-700">
                <th className="px-5 py-3 text-left font-medium text-gray-500 dark:text-gray-400">Name</th>
                <th className="px-5 py-3 text-left font-medium text-gray-500 dark:text-gray-400">Label</th>
                <th className="px-5 py-3 text-left font-medium text-gray-500 dark:text-gray-400">Type</th>
                <th className="px-5 py-3 text-left font-medium text-gray-500 dark:text-gray-400">Required</th>
                <th className="px-5 py-3 text-left font-medium text-gray-500 dark:text-gray-400">Description</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {attrs.map((attr) => (
                <tr key={attr.name} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                  <td className="px-5 py-3 font-mono text-xs">{attr.name}</td>
                  <td className="px-5 py-3">{attr.label}</td>
                  <td className="px-5 py-3">{attr.type}</td>
                  <td className="px-5 py-3">{attr.required ? 'Yes' : 'No'}</td>
                  <td className="px-5 py-3 text-gray-500 dark:text-gray-400">{attr.description || '—'}</td>
                  <td className="px-5 py-3 text-right">
                    <button
                      onClick={() => openEdit(attr)}
                      className="text-xs px-2.5 py-1 rounded border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    >
                      Edit
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal */}
      {modal.open && (
        <div
          className="fixed inset-0 bg-black/40 dark:bg-black/60 z-40 flex items-center justify-center"
          onClick={closeModal}
        >
          <div
            className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-lg mx-4 z-50"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-700">
              <h3 className="text-base font-semibold">
                {modal.mode === 'add' ? 'Add Attribute' : 'Edit Attribute'}
              </h3>
              <button
                onClick={closeModal}
                className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 text-xl leading-none"
                aria-label="Close"
              >
                &times;
              </button>
            </div>

            {/* Modal body */}
            <div className="px-6 py-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={modal.form.name}
                  onChange={(e) => handleFieldChange('name', e.target.value)}
                  disabled={modal.mode === 'edit'}
                  className={`${INPUT_CLASS} disabled:opacity-60 disabled:cursor-not-allowed`}
                  placeholder="e.g. department"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Label <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={modal.form.label}
                  onChange={(e) => handleFieldChange('label', e.target.value)}
                  className={INPUT_CLASS}
                  placeholder="e.g. Department"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Type <span className="text-red-500">*</span>
                </label>
                <select
                  value={modal.form.type}
                  onChange={(e) => handleFieldChange('type', e.target.value)}
                  className={INPUT_CLASS}
                >
                  <option value="text">text</option>
                  <option value="number">number</option>
                  <option value="date">date</option>
                  <option value="boolean">boolean</option>
                  <option value="select">select</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Required
                </label>
                <select
                  value={modal.form.required}
                  onChange={(e) => handleFieldChange('required', e.target.value)}
                  className={INPUT_CLASS}
                >
                  <option value="false">No</option>
                  <option value="true">Yes</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Description
                </label>
                <textarea
                  rows={3}
                  value={modal.form.description}
                  onChange={(e) => handleFieldChange('description', e.target.value)}
                  className={INPUT_CLASS}
                  placeholder="Optional description"
                />
              </div>

              {modal.submitError && (
                <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700 text-red-800 dark:text-red-300 rounded-lg px-4 py-3 text-sm">
                  {modal.submitError}
                </div>
              )}
            </div>

            {/* Modal footer */}
            <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-100 dark:border-gray-700">
              <button
                onClick={closeModal}
                disabled={modal.submitting}
                className="text-sm px-4 py-2 rounded-md border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={modal.submitting}
                className="text-sm px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                {modal.submitting ? 'Saving…' : modal.mode === 'add' ? 'Add' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
