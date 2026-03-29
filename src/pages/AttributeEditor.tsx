import { useEffect, useState } from 'react';
import { api } from '../api/client';

interface AttributeDefinition {
  attributeName: string;
  description: string;
  dataType: string;
  allowsMultiple: boolean;
  isRequired: boolean;
  validationRule: string | null;
  sourceSystem: string;
}

type FormState = {
  attributeName: string;
  dataType: string;
  isRequired: string;
  allowsMultiple: string;
  sourceSystem: string;
  description: string;
  validationRule: string;
};

const EMPTY_FORM: FormState = {
  attributeName: '',
  dataType: 'string',
  isRequired: 'false',
  allowsMultiple: 'false',
  sourceSystem: '',
  description: '',
  validationRule: '',
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
  if (!form.attributeName.trim()) return 'Attribute name is required.';
  if (!form.dataType.trim()) return 'Data type is required.';
  return null;
}

const INPUT_CLASS =
  'w-full rounded-md border border-sand-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-forest-600';

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
      editingName: attr.attributeName,
      form: {
        attributeName: attr.attributeName,
        dataType: attr.dataType,
        isRequired: String(attr.isRequired),
        allowsMultiple: String(attr.allowsMultiple),
        sourceSystem: attr.sourceSystem ?? '',
        description: attr.description ?? '',
        validationRule: attr.validationRule ?? '',
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
      attributeName: modal.form.attributeName.trim(),
      dataType: modal.form.dataType.trim(),
      isRequired: modal.form.isRequired === 'true',
      allowsMultiple: modal.form.allowsMultiple === 'true',
      sourceSystem: modal.form.sourceSystem.trim(),
      description: modal.form.description.trim(),
      validationRule: modal.form.validationRule.trim() || null,
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
        <h2 className="text-lg font-semibold text-gray-800">Attribute Definitions</h2>
        <button
          onClick={openAdd}
          className="text-sm px-3 py-1.5 rounded-md bg-forest-600 text-white hover:bg-forest-700 transition-colors"
        >
          + Add Attribute
        </button>
      </div>

      {loading && <p className="text-gray-500 text-sm">Loading...</p>}

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 rounded-lg px-4 py-3 text-sm">
          {error}
        </div>
      )}

      {!loading && !error && attrs.length === 0 && (
        <p className="text-gray-500 text-sm">No attribute definitions found.</p>
      )}

      {attrs.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-sand-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-sand-200 bg-sand-50">
                <th className="px-5 py-3 text-left font-semibold text-gray-600">Name</th>
                <th className="px-5 py-3 text-left font-semibold text-gray-600">Type</th>
                <th className="px-5 py-3 text-left font-semibold text-gray-600">Required</th>
                <th className="px-5 py-3 text-left font-semibold text-gray-600">Multi</th>
                <th className="px-5 py-3 text-left font-semibold text-gray-600">Source</th>
                <th className="px-5 py-3 text-left font-semibold text-gray-600">Description</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-sand-100">
              {attrs.map((attr) => (
                <tr key={attr.attributeName} className="hover:bg-sand-50">
                  <td className="px-5 py-3 font-mono text-xs text-forest-700">{attr.attributeName}</td>
                  <td className="px-5 py-3">{attr.dataType}</td>
                  <td className="px-5 py-3">{attr.isRequired ? 'Yes' : 'No'}</td>
                  <td className="px-5 py-3">{attr.allowsMultiple ? 'Yes' : 'No'}</td>
                  <td className="px-5 py-3">{attr.sourceSystem}</td>
                  <td className="px-5 py-3 text-gray-500">{attr.description || '—'}</td>
                  <td className="px-5 py-3 text-right">
                    <button
                      onClick={() => openEdit(attr)}
                      className="text-xs px-2.5 py-1 rounded border border-sand-300 text-gray-700 hover:bg-sand-100 transition-colors"
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
          className="fixed inset-0 bg-black/40 z-40 flex items-center justify-center"
          onClick={closeModal}
        >
          <div
            className="bg-white rounded-xl shadow-xl w-full max-w-lg mx-4 z-50"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-sand-200">
              <h3 className="text-base font-semibold text-gray-900">
                {modal.mode === 'add' ? 'Add Attribute' : 'Edit Attribute'}
              </h3>
              <button
                onClick={closeModal}
                className="text-gray-400 hover:text-gray-600 text-xl leading-none"
                aria-label="Close"
              >
                &times;
              </button>
            </div>

            {/* Modal body */}
            <div className="px-6 py-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Attribute Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={modal.form.attributeName}
                  onChange={(e) => handleFieldChange('attributeName', e.target.value)}
                  disabled={modal.mode === 'edit'}
                  className={`${INPUT_CLASS} disabled:opacity-60 disabled:cursor-not-allowed`}
                  placeholder="e.g. department"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Data Type <span className="text-red-500">*</span>
                </label>
                <select
                  value={modal.form.dataType}
                  onChange={(e) => handleFieldChange('dataType', e.target.value)}
                  className={INPUT_CLASS}
                >
                  <option value="string">string</option>
                  <option value="number">number</option>
                  <option value="date">date</option>
                  <option value="boolean">boolean</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Required
                  </label>
                  <select
                    value={modal.form.isRequired}
                    onChange={(e) => handleFieldChange('isRequired', e.target.value)}
                    className={INPUT_CLASS}
                  >
                    <option value="false">No</option>
                    <option value="true">Yes</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Allows Multiple
                  </label>
                  <select
                    value={modal.form.allowsMultiple}
                    onChange={(e) => handleFieldChange('allowsMultiple', e.target.value)}
                    className={INPUT_CLASS}
                  >
                    <option value="false">No</option>
                    <option value="true">Yes</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Source System
                </label>
                <input
                  type="text"
                  value={modal.form.sourceSystem}
                  onChange={(e) => handleFieldChange('sourceSystem', e.target.value)}
                  className={INPUT_CLASS}
                  placeholder="e.g. HR"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  rows={2}
                  value={modal.form.description}
                  onChange={(e) => handleFieldChange('description', e.target.value)}
                  className={INPUT_CLASS}
                  placeholder="Optional description"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Validation Rule
                </label>
                <input
                  type="text"
                  value={modal.form.validationRule}
                  onChange={(e) => handleFieldChange('validationRule', e.target.value)}
                  className={INPUT_CLASS}
                  placeholder="Optional validation rule"
                />
              </div>

              {modal.submitError && (
                <div className="bg-red-50 border border-red-200 text-red-800 rounded-lg px-4 py-3 text-sm">
                  {modal.submitError}
                </div>
              )}
            </div>

            {/* Modal footer */}
            <div className="flex justify-end gap-3 px-6 py-4 border-t border-sand-200">
              <button
                onClick={closeModal}
                disabled={modal.submitting}
                className="text-sm px-4 py-2 rounded-md border border-sand-300 text-gray-700 hover:bg-sand-100 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={modal.submitting}
                className="text-sm px-4 py-2 rounded-md bg-forest-600 text-white hover:bg-forest-700 transition-colors disabled:opacity-50"
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
