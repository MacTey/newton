import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

vi.mock('../api/client', () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
  },
}));

import AttributeEditor from './AttributeEditor';
import { api } from '../api/client';

const mockGet = vi.mocked(api.get);
const mockPost = vi.mocked(api.post);
const mockPut = vi.mocked(api.put);

const ATTR_LIST = [
  { attributeName: 'department', description: 'Primary department', dataType: 'string', allowsMultiple: false, isRequired: false, validationRule: null, sourceSystem: 'HR' },
  { attributeName: 'skills', description: 'Skills and abilities', dataType: 'string', allowsMultiple: true, isRequired: false, validationRule: null, sourceSystem: 'HR' },
];

beforeEach(() => {
  vi.clearAllMocks();
});

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Opens the Add Attribute modal after the list has loaded. */
async function renderAndOpenAddModal() {
  mockGet.mockResolvedValue(ATTR_LIST);
  render(<AttributeEditor />);
  // Wait for list to appear so the component is fully settled.
  await screen.findByText('department');
  await userEvent.click(screen.getByRole('button', { name: /add attribute/i }));
}

/** Opens the Edit modal for the first row (department) after the list has loaded. */
async function renderAndOpenEditModal() {
  mockGet.mockResolvedValue(ATTR_LIST);
  render(<AttributeEditor />);
  await screen.findByText('department');
  const row = screen.getByText('department').closest('tr')!;
  await userEvent.click(within(row).getByRole('button', { name: /edit/i }));
}

// ---------------------------------------------------------------------------
// Loading / error / empty states
// ---------------------------------------------------------------------------

describe('AttributeEditor', () => {
  describe('initial load', () => {
    it('shows Loading... while the fetch is in flight', () => {
      mockGet.mockReturnValue(new Promise(() => {}));
      render(<AttributeEditor />);
      expect(screen.getByText('Loading...')).toBeInTheDocument();
    });

    it('calls api.get with the correct endpoint on mount', async () => {
      mockGet.mockResolvedValue([]);
      render(<AttributeEditor />);
      await screen.findByText('No attribute definitions found.');
      expect(mockGet).toHaveBeenCalledWith('/api/attribute-definitions');
      expect(mockGet).toHaveBeenCalledTimes(1);
    });

    it('shows an error message when the fetch rejects', async () => {
      mockGet.mockRejectedValue(new Error('Internal Server Error'));
      render(<AttributeEditor />);
      expect(await screen.findByText('Internal Server Error')).toBeInTheDocument();
    });

    it('hides the loading indicator after a failed fetch', async () => {
      mockGet.mockRejectedValue(new Error('Oops'));
      render(<AttributeEditor />);
      await screen.findByText('Oops');
      expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
    });

    it('shows the empty-state message when the list is empty', async () => {
      mockGet.mockResolvedValue([]);
      render(<AttributeEditor />);
      expect(await screen.findByText('No attribute definitions found.')).toBeInTheDocument();
    });

    it('does not show the table when the list is empty', async () => {
      mockGet.mockResolvedValue([]);
      render(<AttributeEditor />);
      await screen.findByText('No attribute definitions found.');
      expect(screen.queryByRole('table')).not.toBeInTheDocument();
    });
  });

  // -------------------------------------------------------------------------
  // List rendering
  // -------------------------------------------------------------------------

  describe('list rendering', () => {
    it('renders one row per attribute definition', async () => {
      mockGet.mockResolvedValue(ATTR_LIST);
      render(<AttributeEditor />);
      await screen.findByText('department');
      expect(screen.getByText('department')).toBeInTheDocument();
      expect(screen.getByText('skills')).toBeInTheDocument();
    });

    it('renders the correct dataType for each row', async () => {
      mockGet.mockResolvedValue(ATTR_LIST);
      render(<AttributeEditor />);
      await screen.findByText('department');
      // Both rows have dataType 'string'; there should be two cells with that value.
      expect(screen.getAllByText('string')).toHaveLength(2);
    });

    it('renders Yes for allowsMultiple=true and No for allowsMultiple=false', async () => {
      mockGet.mockResolvedValue(ATTR_LIST);
      render(<AttributeEditor />);
      await screen.findByText('department');
      // department: isRequired=No, allowsMultiple=No; skills: isRequired=No, allowsMultiple=Yes
      // There should be at least one 'Yes' (skills.allowsMultiple) and at least one 'No'.
      expect(screen.getByText('Yes')).toBeInTheDocument();
      expect(screen.getAllByText('No').length).toBeGreaterThanOrEqual(1);
    });

    it('renders Yes for isRequired=true and No for isRequired=false', async () => {
      const listWithRequired = [
        ...ATTR_LIST,
        { attributeName: 'salary', description: '', dataType: 'number', allowsMultiple: false, isRequired: true, validationRule: null, sourceSystem: 'Payroll' },
      ];
      mockGet.mockResolvedValue(listWithRequired);
      render(<AttributeEditor />);
      await screen.findByText('salary');
      // salary.isRequired=true renders as 'Yes' in the Required column
      const salaryRow = screen.getByText('salary').closest('tr')!;
      expect(within(salaryRow).getAllByText('Yes')[0]).toBeInTheDocument();
    });

    it('renders sourceSystem for each row', async () => {
      mockGet.mockResolvedValue(ATTR_LIST);
      render(<AttributeEditor />);
      await screen.findByText('department');
      // Both rows have sourceSystem 'HR'.
      expect(screen.getAllByText('HR')).toHaveLength(2);
    });

    it('renders description text when present', async () => {
      mockGet.mockResolvedValue(ATTR_LIST);
      render(<AttributeEditor />);
      await screen.findByText('Primary department');
    });

    it('renders an em dash placeholder for an empty description', async () => {
      const listWithEmpty = [
        { attributeName: 'nodesc', description: '', dataType: 'string', allowsMultiple: false, isRequired: false, validationRule: null, sourceSystem: 'HR' },
      ];
      mockGet.mockResolvedValue(listWithEmpty);
      render(<AttributeEditor />);
      await screen.findByText('nodesc');
      expect(screen.getByText('—')).toBeInTheDocument();
    });

    it('renders an Edit button for every row', async () => {
      mockGet.mockResolvedValue(ATTR_LIST);
      render(<AttributeEditor />);
      await screen.findByText('department');
      expect(screen.getAllByRole('button', { name: /edit/i })).toHaveLength(2);
    });
  });

  // -------------------------------------------------------------------------
  // Add modal — open / field defaults
  // -------------------------------------------------------------------------

  describe('Add Attribute modal', () => {
    it('opens the modal when + Add Attribute is clicked', async () => {
      await renderAndOpenAddModal();
      expect(screen.getByRole('heading', { name: 'Add Attribute' })).toBeInTheDocument();
    });

    it('shows the Add submit button in add mode', async () => {
      await renderAndOpenAddModal();
      expect(screen.getByRole('button', { name: 'Add' })).toBeInTheDocument();
    });

    it('has an empty attributeName field in add mode', async () => {
      await renderAndOpenAddModal();
      expect(screen.getByPlaceholderText('e.g. department')).toHaveValue('');
    });

    it('defaults the dataType select to "string" in add mode', async () => {
      await renderAndOpenAddModal();
      const selects = screen.getAllByRole('combobox');
      expect(selects[0]).toHaveValue('string');
    });

    it('defaults the isRequired select to "No" (false) in add mode', async () => {
      await renderAndOpenAddModal();
      const selects = screen.getAllByRole('combobox');
      // dataType=selects[0], isRequired=selects[1], allowsMultiple=selects[2]
      expect(selects[1]).toHaveValue('false');
    });

    it('defaults the allowsMultiple select to "No" (false) in add mode', async () => {
      await renderAndOpenAddModal();
      const selects = screen.getAllByRole('combobox');
      expect(selects[2]).toHaveValue('false');
    });

    it('has an empty sourceSystem field in add mode', async () => {
      await renderAndOpenAddModal();
      expect(screen.getByPlaceholderText('e.g. HR')).toHaveValue('');
    });

    it('has an empty description textarea in add mode', async () => {
      await renderAndOpenAddModal();
      expect(screen.getByPlaceholderText('Optional description')).toHaveValue('');
    });

    it('has an empty validationRule field in add mode', async () => {
      await renderAndOpenAddModal();
      expect(screen.getByPlaceholderText('Optional validation rule')).toHaveValue('');
    });

    it('has an enabled attributeName field in add mode', async () => {
      await renderAndOpenAddModal();
      expect(screen.getByPlaceholderText('e.g. department')).not.toBeDisabled();
    });
  });

  // -------------------------------------------------------------------------
  // Edit modal — open / pre-filled fields / disabled attributeName
  // -------------------------------------------------------------------------

  describe('Edit Attribute modal', () => {
    it('opens the modal when Edit is clicked', async () => {
      await renderAndOpenEditModal();
      expect(screen.getByRole('heading', { name: 'Edit Attribute' })).toBeInTheDocument();
    });

    it('shows the Save submit button in edit mode', async () => {
      await renderAndOpenEditModal();
      expect(screen.getByRole('button', { name: 'Save' })).toBeInTheDocument();
    });

    it('pre-fills the attributeName field', async () => {
      await renderAndOpenEditModal();
      expect(screen.getByDisplayValue('department')).toBeInTheDocument();
    });

    it('pre-fills the dataType select', async () => {
      await renderAndOpenEditModal();
      const selects = screen.getAllByRole('combobox');
      expect(selects[0]).toHaveValue('string');
    });

    it('pre-fills the isRequired select with false for isRequired=false', async () => {
      await renderAndOpenEditModal();
      const selects = screen.getAllByRole('combobox');
      expect(selects[1]).toHaveValue('false');
    });

    it('pre-fills the allowsMultiple select with false for allowsMultiple=false', async () => {
      await renderAndOpenEditModal();
      const selects = screen.getAllByRole('combobox');
      expect(selects[2]).toHaveValue('false');
    });

    it('pre-fills the sourceSystem field', async () => {
      await renderAndOpenEditModal();
      expect(screen.getByDisplayValue('HR')).toBeInTheDocument();
    });

    it('pre-fills the description field', async () => {
      await renderAndOpenEditModal();
      expect(screen.getByDisplayValue('Primary department')).toBeInTheDocument();
    });

    it('disables the attributeName field in edit mode', async () => {
      await renderAndOpenEditModal();
      expect(screen.getByDisplayValue('department')).toBeDisabled();
    });

    it('pre-fills allowsMultiple=true for an attribute with allowsMultiple:true', async () => {
      mockGet.mockResolvedValue(ATTR_LIST);
      render(<AttributeEditor />);
      await screen.findByText('skills');
      const skillsRow = screen.getByText('skills').closest('tr')!;
      await userEvent.click(within(skillsRow).getByRole('button', { name: /edit/i }));
      const selects = screen.getAllByRole('combobox');
      expect(selects[2]).toHaveValue('true');
    });

    it('pre-fills isRequired=true for an attribute with isRequired:true', async () => {
      const listWithRequired = [
        { attributeName: 'salary', description: '', dataType: 'number', allowsMultiple: false, isRequired: true, validationRule: null, sourceSystem: 'Payroll' },
      ];
      mockGet.mockResolvedValue(listWithRequired);
      render(<AttributeEditor />);
      await screen.findByText('salary');
      const salaryRow = screen.getByText('salary').closest('tr')!;
      await userEvent.click(within(salaryRow).getByRole('button', { name: /edit/i }));
      const selects = screen.getAllByRole('combobox');
      expect(selects[1]).toHaveValue('true');
    });
  });

  // -------------------------------------------------------------------------
  // Validation
  // -------------------------------------------------------------------------

  describe('form validation', () => {
    it('shows "Attribute name is required." when attributeName is empty on submit', async () => {
      await renderAndOpenAddModal();
      await userEvent.click(screen.getByRole('button', { name: 'Add' }));
      expect(await screen.findByText('Attribute name is required.')).toBeInTheDocument();
    });

    it('does not call api.post when validation fails', async () => {
      await renderAndOpenAddModal();
      await userEvent.click(screen.getByRole('button', { name: 'Add' }));
      await screen.findByText('Attribute name is required.');
      expect(mockPost).not.toHaveBeenCalled();
    });

    it('keeps the modal open after a validation error', async () => {
      await renderAndOpenAddModal();
      await userEvent.click(screen.getByRole('button', { name: 'Add' }));
      await screen.findByText('Attribute name is required.');
      expect(screen.getByRole('heading', { name: 'Add Attribute' })).toBeInTheDocument();
    });

    it('clears a previous validation error when a subsequent valid submit fires', async () => {
      mockPost.mockResolvedValue(undefined);
      mockGet.mockResolvedValueOnce(ATTR_LIST).mockResolvedValueOnce(ATTR_LIST);

      await renderAndOpenAddModal();
      // First submit — triggers validation error.
      await userEvent.click(screen.getByRole('button', { name: 'Add' }));
      await screen.findByText('Attribute name is required.');

      // Fill in required field.
      await userEvent.type(screen.getByPlaceholderText('e.g. department'), 'newattr');
      await userEvent.click(screen.getByRole('button', { name: 'Add' }));

      // After successful submit the modal closes — validation error is gone.
      await screen.findByText('department'); // list re-rendered
      expect(screen.queryByText('Attribute name is required.')).not.toBeInTheDocument();
    });
  });

  // -------------------------------------------------------------------------
  // Successful add (POST)
  // -------------------------------------------------------------------------

  describe('successful add', () => {
    async function fillAndSubmitAddForm() {
      mockPost.mockResolvedValue(undefined);
      mockGet
        .mockResolvedValueOnce(ATTR_LIST)          // initial load
        .mockResolvedValueOnce([                    // re-fetch after save
          ...ATTR_LIST,
          { attributeName: 'bonus', description: 'Bonus amount', dataType: 'number', allowsMultiple: false, isRequired: true, validationRule: null, sourceSystem: 'Payroll' },
        ]);
      await renderAndOpenAddModal();

      await userEvent.type(screen.getByPlaceholderText('e.g. department'), 'bonus');
      // Change dataType to number.
      await userEvent.selectOptions(screen.getAllByRole('combobox')[0], 'number');
      // Set isRequired to Yes.
      await userEvent.selectOptions(screen.getAllByRole('combobox')[1], 'true');
      // Set sourceSystem.
      await userEvent.type(screen.getByPlaceholderText('e.g. HR'), 'Payroll');
      await userEvent.type(screen.getByPlaceholderText('Optional description'), 'Bonus amount');

      await userEvent.click(screen.getByRole('button', { name: 'Add' }));
    }

    it('calls api.post with the correct endpoint and payload', async () => {
      await fillAndSubmitAddForm();
      await screen.findByText('bonus'); // wait for list refresh
      expect(mockPost).toHaveBeenCalledWith('/api/attribute-definitions', {
        attributeName: 'bonus',
        dataType: 'number',
        isRequired: true,
        allowsMultiple: false,
        sourceSystem: 'Payroll',
        description: 'Bonus amount',
        validationRule: null,
      });
    });

    it('closes the modal after a successful post', async () => {
      await fillAndSubmitAddForm();
      await screen.findByText('bonus');
      expect(screen.queryByRole('heading', { name: 'Add Attribute' })).not.toBeInTheDocument();
    });

    it('re-fetches the list after a successful post', async () => {
      await fillAndSubmitAddForm();
      await screen.findByText('bonus');
      // Initial load + re-fetch = 2 calls.
      expect(mockGet).toHaveBeenCalledTimes(2);
      expect(mockGet).toHaveBeenLastCalledWith('/api/attribute-definitions');
    });

    it('shows the newly added item in the list after the re-fetch', async () => {
      await fillAndSubmitAddForm();
      expect(await screen.findByText('bonus')).toBeInTheDocument();
    });
  });

  // -------------------------------------------------------------------------
  // Successful edit (PUT)
  // -------------------------------------------------------------------------

  describe('successful edit', () => {
    async function fillAndSubmitEditForm() {
      mockPut.mockResolvedValue(undefined);
      mockGet
        .mockResolvedValueOnce(ATTR_LIST)  // initial load
        .mockResolvedValueOnce([           // re-fetch after save
          { attributeName: 'department', description: 'Updated desc', dataType: 'string', allowsMultiple: false, isRequired: false, validationRule: null, sourceSystem: 'HR' },
          ATTR_LIST[1],
        ]);
      await renderAndOpenEditModal();

      // Update description.
      const descTextarea = screen.getByDisplayValue('Primary department');
      await userEvent.clear(descTextarea);
      await userEvent.type(descTextarea, 'Updated desc');

      await userEvent.click(screen.getByRole('button', { name: 'Save' }));
    }

    it('calls api.put with the correct URL and payload', async () => {
      await fillAndSubmitEditForm();
      await screen.findByText('Updated desc');
      expect(mockPut).toHaveBeenCalledWith('/api/attribute-definitions/department', {
        attributeName: 'department',
        dataType: 'string',
        isRequired: false,
        allowsMultiple: false,
        sourceSystem: 'HR',
        description: 'Updated desc',
        validationRule: null,
      });
    });

    it('does not call api.post in edit mode', async () => {
      await fillAndSubmitEditForm();
      await screen.findByText('Updated desc');
      expect(mockPost).not.toHaveBeenCalled();
    });

    it('closes the modal after a successful put', async () => {
      await fillAndSubmitEditForm();
      await screen.findByText('Updated desc');
      expect(screen.queryByRole('heading', { name: 'Edit Attribute' })).not.toBeInTheDocument();
    });

    it('re-fetches the list after a successful put', async () => {
      await fillAndSubmitEditForm();
      await screen.findByText('Updated desc');
      expect(mockGet).toHaveBeenCalledTimes(2);
      expect(mockGet).toHaveBeenLastCalledWith('/api/attribute-definitions');
    });

    it('reflects updated data in the table after re-fetch', async () => {
      await fillAndSubmitEditForm();
      expect(await screen.findByText('Updated desc')).toBeInTheDocument();
    });
  });

  // -------------------------------------------------------------------------
  // API error on submit
  // -------------------------------------------------------------------------

  describe('submit API errors', () => {
    it('shows the error message from the server when api.post rejects', async () => {
      mockPost.mockRejectedValue(new Error('Conflict: name already exists'));
      mockGet.mockResolvedValue(ATTR_LIST);
      await renderAndOpenAddModal();

      await userEvent.type(screen.getByPlaceholderText('e.g. department'), 'newattr');
      await userEvent.click(screen.getByRole('button', { name: 'Add' }));

      expect(await screen.findByText('Conflict: name already exists')).toBeInTheDocument();
    });

    it('keeps the modal open after a failed post', async () => {
      mockPost.mockRejectedValue(new Error('Server error'));
      mockGet.mockResolvedValue(ATTR_LIST);
      await renderAndOpenAddModal();

      await userEvent.type(screen.getByPlaceholderText('e.g. department'), 'newattr');
      await userEvent.click(screen.getByRole('button', { name: 'Add' }));

      await screen.findByText('Server error');
      expect(screen.getByRole('heading', { name: 'Add Attribute' })).toBeInTheDocument();
    });

    it('does not re-fetch the list after a failed post', async () => {
      mockPost.mockRejectedValue(new Error('Server error'));
      mockGet.mockResolvedValue(ATTR_LIST);
      await renderAndOpenAddModal();

      await userEvent.type(screen.getByPlaceholderText('e.g. department'), 'newattr');
      await userEvent.click(screen.getByRole('button', { name: 'Add' }));

      await screen.findByText('Server error');
      // Only the initial load call; no second call for list refresh.
      expect(mockGet).toHaveBeenCalledTimes(1);
    });

    it('shows a generic error message when the thrown value is not an Error instance', async () => {
      mockPost.mockRejectedValue('raw string error');
      mockGet.mockResolvedValue(ATTR_LIST);
      await renderAndOpenAddModal();

      await userEvent.type(screen.getByPlaceholderText('e.g. department'), 'newattr');
      await userEvent.click(screen.getByRole('button', { name: 'Add' }));

      expect(await screen.findByText('An error occurred.')).toBeInTheDocument();
    });
  });

  // -------------------------------------------------------------------------
  // Cancel button
  // -------------------------------------------------------------------------

  describe('cancel button', () => {
    it('closes the add modal when Cancel is clicked', async () => {
      await renderAndOpenAddModal();
      await userEvent.click(screen.getByRole('button', { name: /cancel/i }));
      expect(screen.queryByRole('heading', { name: 'Add Attribute' })).not.toBeInTheDocument();
    });

    it('closes the edit modal when Cancel is clicked', async () => {
      await renderAndOpenEditModal();
      await userEvent.click(screen.getByRole('button', { name: /cancel/i }));
      expect(screen.queryByRole('heading', { name: 'Edit Attribute' })).not.toBeInTheDocument();
    });

    it('does not call api.post or api.put when Cancel is clicked', async () => {
      await renderAndOpenAddModal();
      await userEvent.type(screen.getByPlaceholderText('e.g. department'), 'newattr');
      await userEvent.click(screen.getByRole('button', { name: /cancel/i }));
      expect(mockPost).not.toHaveBeenCalled();
      expect(mockPut).not.toHaveBeenCalled();
    });

    it('leaves the list untouched (no re-fetch) when Cancel is clicked', async () => {
      await renderAndOpenAddModal();
      await userEvent.click(screen.getByRole('button', { name: /cancel/i }));
      // Only the initial mount fetch should have occurred.
      expect(mockGet).toHaveBeenCalledTimes(1);
    });
  });

  // -------------------------------------------------------------------------
  // Close button (×)
  // -------------------------------------------------------------------------

  describe('close (×) button', () => {
    it('closes the modal when the × button is clicked', async () => {
      await renderAndOpenAddModal();
      await userEvent.click(screen.getByRole('button', { name: /close/i }));
      expect(screen.queryByRole('heading', { name: 'Add Attribute' })).not.toBeInTheDocument();
    });
  });

  // -------------------------------------------------------------------------
  // Backdrop click
  // -------------------------------------------------------------------------

  describe('backdrop click', () => {
    it('closes the modal when the backdrop is clicked', async () => {
      await renderAndOpenAddModal();
      const modalPanel = screen.getByRole('heading', { name: 'Add Attribute' }).closest('div[class*="rounded-xl"]')!;
      const backdrop = modalPanel.parentElement!;
      await userEvent.click(backdrop);
      expect(screen.queryByRole('heading', { name: 'Add Attribute' })).not.toBeInTheDocument();
    });

    it('does not close the modal when the modal panel itself is clicked', async () => {
      await renderAndOpenAddModal();
      const modalPanel = screen.getByRole('heading', { name: 'Add Attribute' }).closest('div[class*="rounded-xl"]')!;
      await userEvent.click(modalPanel);
      expect(screen.getByRole('heading', { name: 'Add Attribute' })).toBeInTheDocument();
    });
  });

  // -------------------------------------------------------------------------
  // Body overflow side-effect
  // -------------------------------------------------------------------------

  describe('body overflow side-effect', () => {
    it('sets overflow:hidden on body when modal opens', async () => {
      await renderAndOpenAddModal();
      expect(document.body.style.overflow).toBe('hidden');
    });

    it('restores overflow to empty string when modal closes', async () => {
      await renderAndOpenAddModal();
      await userEvent.click(screen.getByRole('button', { name: /cancel/i }));
      expect(document.body.style.overflow).toBe('');
    });
  });
});
