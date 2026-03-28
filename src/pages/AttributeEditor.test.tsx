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
  { name: 'department', label: 'Department', type: 'text', required: false, description: 'The dept' },
  { name: 'salary', label: 'Salary', type: 'number', required: true, description: '' },
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
  await screen.findByText('Department');
  await userEvent.click(screen.getByRole('button', { name: /add attribute/i }));
}

/** Opens the Edit modal for the first row (department) after the list has loaded. */
async function renderAndOpenEditModal() {
  mockGet.mockResolvedValue(ATTR_LIST);
  render(<AttributeEditor />);
  await screen.findByText('Department');
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
      await screen.findByText('Department');
      expect(screen.getByText('department')).toBeInTheDocument();
      expect(screen.getByText('Salary')).toBeInTheDocument();
      expect(screen.getByText('salary')).toBeInTheDocument();
    });

    it('renders the correct type for each row', async () => {
      mockGet.mockResolvedValue(ATTR_LIST);
      render(<AttributeEditor />);
      await screen.findByText('Department');
      expect(screen.getByText('text')).toBeInTheDocument();
      expect(screen.getByText('number')).toBeInTheDocument();
    });

    it('renders Yes for required=true and No for required=false', async () => {
      mockGet.mockResolvedValue(ATTR_LIST);
      render(<AttributeEditor />);
      await screen.findByText('Department');
      expect(screen.getByText('Yes')).toBeInTheDocument();
      expect(screen.getByText('No')).toBeInTheDocument();
    });

    it('renders description text when present', async () => {
      mockGet.mockResolvedValue(ATTR_LIST);
      render(<AttributeEditor />);
      await screen.findByText('The dept');
    });

    it('renders an em dash placeholder for an empty description', async () => {
      mockGet.mockResolvedValue(ATTR_LIST);
      render(<AttributeEditor />);
      await screen.findByText('Department');
      // The salary row has description:'', which should render as '—'.
      expect(screen.getByText('—')).toBeInTheDocument();
    });

    it('renders an Edit button for every row', async () => {
      mockGet.mockResolvedValue(ATTR_LIST);
      render(<AttributeEditor />);
      await screen.findByText('Department');
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

    it('has an empty name field in add mode', async () => {
      await renderAndOpenAddModal();
      expect(screen.getByPlaceholderText('e.g. department')).toHaveValue('');
    });

    it('has an empty label field in add mode', async () => {
      await renderAndOpenAddModal();
      expect(screen.getByPlaceholderText('e.g. Department')).toHaveValue('');
    });

    it('defaults the type select to "text" in add mode', async () => {
      await renderAndOpenAddModal();
      const typeSelect = screen.getByDisplayValue('text');
      expect(typeSelect).toBeInTheDocument();
    });

    it('defaults the required select to "No" in add mode', async () => {
      await renderAndOpenAddModal();
      // Both type and required selects are present; the required one shows 'No'.
      const selects = screen.getAllByRole('combobox');
      const requiredSelect = selects[1]; // type is selects[0], required is selects[1]
      expect(requiredSelect).toHaveValue('false');
    });

    it('has an empty description textarea in add mode', async () => {
      await renderAndOpenAddModal();
      expect(screen.getByPlaceholderText(/optional description/i)).toHaveValue('');
    });

    it('has an enabled name field in add mode', async () => {
      await renderAndOpenAddModal();
      expect(screen.getByPlaceholderText('e.g. department')).not.toBeDisabled();
    });
  });

  // -------------------------------------------------------------------------
  // Edit modal — open / pre-filled fields / disabled name
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

    it('pre-fills the name field with the attribute name', async () => {
      await renderAndOpenEditModal();
      expect(screen.getByDisplayValue('department')).toBeInTheDocument();
    });

    it('pre-fills the label field', async () => {
      await renderAndOpenEditModal();
      expect(screen.getByDisplayValue('Department')).toBeInTheDocument();
    });

    it('pre-fills the type select', async () => {
      await renderAndOpenEditModal();
      // Verify the type combobox has 'text' selected for the department attribute.
      const selects = screen.getAllByRole('combobox');
      expect(selects[0]).toHaveValue('text');
    });

    it('pre-fills the required select with false for required=false', async () => {
      await renderAndOpenEditModal();
      const selects = screen.getAllByRole('combobox');
      expect(selects[1]).toHaveValue('false');
    });

    it('pre-fills the description field', async () => {
      await renderAndOpenEditModal();
      expect(screen.getByDisplayValue('The dept')).toBeInTheDocument();
    });

    it('disables the name field in edit mode', async () => {
      await renderAndOpenEditModal();
      expect(screen.getByDisplayValue('department')).toBeDisabled();
    });

    it('pre-fills required=true for an attribute with required:true', async () => {
      mockGet.mockResolvedValue(ATTR_LIST);
      render(<AttributeEditor />);
      await screen.findByText('Salary');
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
    it('shows "Name is required." when name is empty on submit', async () => {
      await renderAndOpenAddModal();
      await userEvent.click(screen.getByRole('button', { name: 'Add' }));
      expect(await screen.findByText('Name is required.')).toBeInTheDocument();
    });

    it('shows "Label is required." when label is empty on submit', async () => {
      await renderAndOpenAddModal();
      await userEvent.type(screen.getByPlaceholderText('e.g. department'), 'myattr');
      await userEvent.click(screen.getByRole('button', { name: 'Add' }));
      expect(await screen.findByText('Label is required.')).toBeInTheDocument();
    });

    it('does not call api.post when validation fails', async () => {
      await renderAndOpenAddModal();
      await userEvent.click(screen.getByRole('button', { name: 'Add' }));
      await screen.findByText('Name is required.');
      expect(mockPost).not.toHaveBeenCalled();
    });

    it('keeps the modal open after a validation error', async () => {
      await renderAndOpenAddModal();
      await userEvent.click(screen.getByRole('button', { name: 'Add' }));
      await screen.findByText('Name is required.');
      expect(screen.getByRole('heading', { name: 'Add Attribute' })).toBeInTheDocument();
    });

    it('clears a previous validation error when a subsequent valid submit fires', async () => {
      mockPost.mockResolvedValue(undefined);
      // Second get call for the re-fetch after save.
      mockGet.mockResolvedValueOnce(ATTR_LIST).mockResolvedValueOnce(ATTR_LIST);

      await renderAndOpenAddModal();
      // First submit — triggers validation error.
      await userEvent.click(screen.getByRole('button', { name: 'Add' }));
      await screen.findByText('Name is required.');

      // Fill in required fields.
      await userEvent.type(screen.getByPlaceholderText('e.g. department'), 'newattr');
      await userEvent.type(screen.getByPlaceholderText('e.g. Department'), 'New Attr');
      await userEvent.click(screen.getByRole('button', { name: 'Add' }));

      // After successful submit the modal closes — validation error is gone.
      await screen.findByText('Department'); // list re-rendered
      expect(screen.queryByText('Name is required.')).not.toBeInTheDocument();
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
          { name: 'bonus', label: 'Bonus', type: 'number', required: false, description: '' },
        ]);
      await renderAndOpenAddModal();

      await userEvent.type(screen.getByPlaceholderText('e.g. department'), 'bonus');
      await userEvent.type(screen.getByPlaceholderText('e.g. Department'), 'Bonus');
      // Change type to number.
      await userEvent.selectOptions(screen.getAllByRole('combobox')[0], 'number');
      // Set required to Yes.
      await userEvent.selectOptions(screen.getAllByRole('combobox')[1], 'true');
      await userEvent.type(screen.getByPlaceholderText(/optional description/i), 'Bonus amount');

      await userEvent.click(screen.getByRole('button', { name: 'Add' }));
    }

    it('calls api.post with the correct endpoint and payload', async () => {
      await fillAndSubmitAddForm();
      await screen.findByText('Bonus'); // wait for list refresh
      expect(mockPost).toHaveBeenCalledWith('/api/attribute-definitions', {
        name: 'bonus',
        label: 'Bonus',
        type: 'number',
        required: true,
        description: 'Bonus amount',
      });
    });

    it('closes the modal after a successful post', async () => {
      await fillAndSubmitAddForm();
      await screen.findByText('Bonus');
      expect(screen.queryByRole('heading', { name: 'Add Attribute' })).not.toBeInTheDocument();
    });

    it('re-fetches the list after a successful post', async () => {
      await fillAndSubmitAddForm();
      await screen.findByText('Bonus');
      // Initial load + re-fetch = 2 calls.
      expect(mockGet).toHaveBeenCalledTimes(2);
      expect(mockGet).toHaveBeenLastCalledWith('/api/attribute-definitions');
    });

    it('shows the newly added item in the list after the re-fetch', async () => {
      await fillAndSubmitAddForm();
      expect(await screen.findByText('Bonus')).toBeInTheDocument();
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
          { name: 'department', label: 'Updated Dept', type: 'text', required: false, description: 'Updated desc' },
          ATTR_LIST[1],
        ]);
      await renderAndOpenEditModal();

      // Clear and retype the label.
      const labelInput = screen.getByDisplayValue('Department');
      await userEvent.clear(labelInput);
      await userEvent.type(labelInput, 'Updated Dept');

      // Update description.
      const descTextarea = screen.getByDisplayValue('The dept');
      await userEvent.clear(descTextarea);
      await userEvent.type(descTextarea, 'Updated desc');

      await userEvent.click(screen.getByRole('button', { name: 'Save' }));
    }

    it('calls api.put with the correct URL and payload', async () => {
      await fillAndSubmitEditForm();
      await screen.findByText('Updated Dept');
      expect(mockPut).toHaveBeenCalledWith('/api/attribute-definitions/department', {
        name: 'department',
        label: 'Updated Dept',
        type: 'text',
        required: false,
        description: 'Updated desc',
      });
    });

    it('does not call api.post in edit mode', async () => {
      await fillAndSubmitEditForm();
      await screen.findByText('Updated Dept');
      expect(mockPost).not.toHaveBeenCalled();
    });

    it('closes the modal after a successful put', async () => {
      await fillAndSubmitEditForm();
      await screen.findByText('Updated Dept');
      expect(screen.queryByRole('heading', { name: 'Edit Attribute' })).not.toBeInTheDocument();
    });

    it('re-fetches the list after a successful put', async () => {
      await fillAndSubmitEditForm();
      await screen.findByText('Updated Dept');
      expect(mockGet).toHaveBeenCalledTimes(2);
      expect(mockGet).toHaveBeenLastCalledWith('/api/attribute-definitions');
    });

    it('reflects updated data in the table after re-fetch', async () => {
      await fillAndSubmitEditForm();
      expect(await screen.findByText('Updated Dept')).toBeInTheDocument();
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
      await userEvent.type(screen.getByPlaceholderText('e.g. Department'), 'New Attr');
      await userEvent.click(screen.getByRole('button', { name: 'Add' }));

      expect(await screen.findByText('Conflict: name already exists')).toBeInTheDocument();
    });

    it('keeps the modal open after a failed post', async () => {
      mockPost.mockRejectedValue(new Error('Server error'));
      mockGet.mockResolvedValue(ATTR_LIST);
      await renderAndOpenAddModal();

      await userEvent.type(screen.getByPlaceholderText('e.g. department'), 'newattr');
      await userEvent.type(screen.getByPlaceholderText('e.g. Department'), 'New Attr');
      await userEvent.click(screen.getByRole('button', { name: 'Add' }));

      await screen.findByText('Server error');
      expect(screen.getByRole('heading', { name: 'Add Attribute' })).toBeInTheDocument();
    });

    it('does not re-fetch the list after a failed post', async () => {
      mockPost.mockRejectedValue(new Error('Server error'));
      mockGet.mockResolvedValue(ATTR_LIST);
      await renderAndOpenAddModal();

      await userEvent.type(screen.getByPlaceholderText('e.g. department'), 'newattr');
      await userEvent.type(screen.getByPlaceholderText('e.g. Department'), 'New Attr');
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
      await userEvent.type(screen.getByPlaceholderText('e.g. Department'), 'New Attr');
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
      // The backdrop is the fixed overlay div. We click it directly via its
      // test-id-less role: it carries no role, so we target it as the element
      // whose onClick is wired to closeModal — that is the parent of the modal
      // panel. We query the heading's container and find the outer backdrop div.
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
