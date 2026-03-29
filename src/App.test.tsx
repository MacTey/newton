import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import userEvent from '@testing-library/user-event';
import { renderValue } from './App';
import App from './App';

vi.mock('./assets/logo.png', () => ({ default: 'logo.png' }));
vi.mock('./api/client', () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
  },
}));

import { api } from './api/client';
const mockGet = vi.mocked(api.get);
const mockPost = vi.mocked(api.post);
const mockPut = vi.mocked(api.put);

const EMPLOYEE_LIST = [
  { employeeId: '1', firstName: 'Ada', lastName: 'Lovelace', sourceSystem: 'HR' },
  { employeeId: '2', firstName: 'Alan', lastName: 'Turing', sourceSystem: 'HR' },
];

const SNAPSHOT = {
  employee_id: '1',
  first_name: 'Ada',
  last_name: 'Lovelace',
  job_title: 'Engineer',
  status: 'ACTIVE',
  email: 'ada@example.com',
  phone: null,
  hire_date: '2020-01-01',
  salary: 90000,
  manager_id: null,
  source_system: 'HR',
  attributes: [],
};

beforeEach(() => {
  vi.clearAllMocks();
  document.documentElement.classList.remove('dark');
  localStorage.clear();
});

describe('renderValue', () => {
  it('returns em dash for null', () => expect(renderValue(null)).toBe('—'));
  it('returns em dash for undefined', () => expect(renderValue(undefined)).toBe('—'));
  it('converts numbers to strings', () => expect(renderValue(42000)).toBe('42000'));
  it('passes strings through', () => expect(renderValue('active')).toBe('active'));
});

describe('App', () => {
  it('shows loading state while employee list is fetching', () => {
    mockGet.mockReturnValue(new Promise(() => {}));
    render(<MemoryRouter><App /></MemoryRouter>);
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('renders employee list on success', async () => {
    mockGet.mockResolvedValue(EMPLOYEE_LIST);
    render(<MemoryRouter><App /></MemoryRouter>);
    expect(await screen.findByText('Ada Lovelace')).toBeInTheDocument();
    expect(screen.getByText('Alan Turing')).toBeInTheDocument();
  });

  it('shows error message when employee list fetch fails', async () => {
    mockGet.mockRejectedValue(new Error('Network timeout'));
    render(<MemoryRouter><App /></MemoryRouter>);
    expect(await screen.findByText('Network timeout')).toBeInTheDocument();
  });

  it('shows empty state when no employees', async () => {
    mockGet.mockResolvedValue([]);
    render(<MemoryRouter><App /></MemoryRouter>);
    expect(await screen.findByText('No employees found.')).toBeInTheDocument();
  });

  it('fetches snapshot when an employee is selected', async () => {
    mockGet
      .mockResolvedValueOnce(EMPLOYEE_LIST)
      .mockReturnValueOnce(new Promise(() => {}));

    render(<MemoryRouter><App /></MemoryRouter>);
    await screen.findByText('Ada Lovelace');
    await userEvent.click(screen.getByText('Ada Lovelace'));

    expect(mockGet).toHaveBeenCalledWith('/api/employees/1/snapshot');
  });

  it('renders structured card fields after selecting an employee', async () => {
    mockGet
      .mockResolvedValueOnce(EMPLOYEE_LIST)
      .mockResolvedValueOnce(SNAPSHOT);

    render(<MemoryRouter><App /></MemoryRouter>);
    await screen.findByText('Ada Lovelace');
    await userEvent.click(screen.getByText('Ada Lovelace'));

    // Wait for the detail panel to appear (hire date is unique on the page)
    expect(await screen.findByText('2020-01-01')).toBeInTheDocument();

    // Employee ID section
    expect(screen.getByText('Employee ID', { selector: 'p' })).toBeInTheDocument();
    // The monospace <p> in the card; the list also shows '1' in a <span>, so be specific
    expect(screen.getByText('1', { selector: 'p' })).toBeInTheDocument();

    // Name fields (rendered as field labels and values in the card)
    expect(screen.getByText('First Name', { selector: 'p' })).toBeInTheDocument();
    expect(screen.getByText('Last Name', { selector: 'p' })).toBeInTheDocument();

    // Job Title, Hire Date, Status
    expect(screen.getByText('Job Title', { selector: 'p' })).toBeInTheDocument();
    expect(screen.getByText('ACTIVE')).toBeInTheDocument();

    // Email, Phone
    expect(screen.getByText('ada@example.com')).toBeInTheDocument();
    expect(screen.getByText('Phone', { selector: 'p' })).toBeInTheDocument();

    // Salary label
    expect(screen.getByText('Salary', { selector: 'p' })).toBeInTheDocument();
  });

  it('renders em dash for null phone field', async () => {
    mockGet
      .mockResolvedValueOnce(EMPLOYEE_LIST)
      .mockResolvedValueOnce(SNAPSHOT);

    render(<MemoryRouter><App /></MemoryRouter>);
    await screen.findByText('Ada Lovelace');
    await userEvent.click(screen.getByText('Ada Lovelace'));

    await screen.findByText('2020-01-01');
    expect(screen.getAllByText('—').length).toBeGreaterThan(0);
  });

  it('does not render source_system in the detail card', async () => {
    mockGet
      .mockResolvedValueOnce(EMPLOYEE_LIST)
      .mockResolvedValueOnce(SNAPSHOT);

    render(<MemoryRouter><App /></MemoryRouter>);
    await screen.findByText('Ada Lovelace');
    await userEvent.click(screen.getByText('Ada Lovelace'));

    await screen.findByText('2020-01-01');
    expect(screen.queryByText('Source System', { exact: false })).not.toBeInTheDocument();
    expect(screen.queryByText('source system', { exact: false })).not.toBeInTheDocument();
  });

  it('salary value has blur-sm class in read mode', async () => {
    mockGet
      .mockResolvedValueOnce(EMPLOYEE_LIST)
      .mockResolvedValueOnce(SNAPSHOT);

    render(<MemoryRouter><App /></MemoryRouter>);
    await screen.findByText('Ada Lovelace');
    await userEvent.click(screen.getByText('Ada Lovelace'));

    await screen.findByText('2020-01-01');
    const salaryValue = screen.getByText('90000');
    expect(salaryValue).toHaveClass('blur-sm');
  });

  it('renders attributes as tags when snapshot has multi-valued attributes', async () => {
    const snapshotWithAttributes = {
      ...SNAPSHOT,
      attributes: [
        { attribute_name: 'skills', attribute_value: 'TypeScript', value_position: 1, is_multi_valued: true },
        { attribute_name: 'skills', attribute_value: 'React', value_position: 2, is_multi_valued: true },
        { attribute_name: 'certifications', attribute_value: 'AWS', value_position: 1, is_multi_valued: true },
      ],
    };

    mockGet
      .mockResolvedValueOnce(EMPLOYEE_LIST)
      .mockResolvedValueOnce(snapshotWithAttributes);

    render(<MemoryRouter><App /></MemoryRouter>);
    await screen.findByText('Ada Lovelace');
    await userEvent.click(screen.getByText('Ada Lovelace'));

    expect(await screen.findByText('TypeScript')).toBeInTheDocument();
    expect(screen.getByText('React')).toBeInTheDocument();
    expect(screen.getByText('AWS')).toBeInTheDocument();
  });

  it('does not render attributes section when snapshot.attributes is empty', async () => {
    mockGet
      .mockResolvedValueOnce(EMPLOYEE_LIST)
      .mockResolvedValueOnce(SNAPSHOT);

    render(<MemoryRouter><App /></MemoryRouter>);
    await screen.findByText('Ada Lovelace');
    await userEvent.click(screen.getByText('Ada Lovelace'));

    await screen.findByText('2020-01-01');
    // The nav link "Attributes" is always present; check the section <h3> is absent
    expect(screen.queryByRole('heading', { name: 'Attributes', level: 3 })).not.toBeInTheDocument();
  });

  it('shows detail error when snapshot fetch fails', async () => {
    mockGet
      .mockResolvedValueOnce(EMPLOYEE_LIST)
      .mockRejectedValueOnce(new Error('Snapshot unavailable'));

    render(<MemoryRouter><App /></MemoryRouter>);
    await screen.findByText('Ada Lovelace');
    await userEvent.click(screen.getByText('Ada Lovelace'));

    expect(await screen.findByText('Snapshot unavailable')).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// Helper: render the app, wait for the employee list, select Ada, wait for
// the detail panel to appear (indicated by the job title in the panel header).
// ---------------------------------------------------------------------------
async function renderAndSelectAda() {
  mockGet
    .mockResolvedValueOnce(EMPLOYEE_LIST)   // initial employees fetch
    .mockResolvedValueOnce(SNAPSHOT);       // snapshot fetch on select
  render(<MemoryRouter><App /></MemoryRouter>);
  await screen.findByText('Ada Lovelace');
  await userEvent.click(screen.getByText('Ada Lovelace'));
  // Wait for detail panel — hire date is unique on the page
  await screen.findByText('2020-01-01');
}

// ---------------------------------------------------------------------------
// Helper: render the app with the employee list loaded, then click "+ Add" to
// open the modal. mockGet must already be set up by the caller (or uses the
// default single-resolve path provided here).
// ---------------------------------------------------------------------------
async function renderAndOpenAddModal() {
  mockGet.mockResolvedValueOnce(EMPLOYEE_LIST);
  render(<MemoryRouter><App /></MemoryRouter>);
  await screen.findByText('Ada Lovelace');
  await userEvent.click(screen.getByRole('button', { name: '+ Add' }));
  await screen.findByText('New Employee');
}

describe('Add Employee modal', () => {
  it('opens when the + Add button is clicked', async () => {
    await renderAndOpenAddModal();
    expect(screen.getByText('New Employee')).toBeInTheDocument();
  });

  it('closes when the Cancel button is clicked', async () => {
    await renderAndOpenAddModal();
    await userEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(screen.queryByText('New Employee')).not.toBeInTheDocument();
  });

  it('closes when the × button is clicked', async () => {
    await renderAndOpenAddModal();
    await userEvent.click(screen.getByRole('button', { name: 'Close' }));
    expect(screen.queryByText('New Employee')).not.toBeInTheDocument();
  });

  it('shows validation error when required fields are empty', async () => {
    await renderAndOpenAddModal();
    await userEvent.click(screen.getByRole('button', { name: 'Add Employee' }));
    expect(await screen.findByText('First name is required.')).toBeInTheDocument();
  });

  it('shows validation error when only firstName is filled', async () => {
    await renderAndOpenAddModal();
    await userEvent.type(screen.getByPlaceholderText('First name'), 'Grace');
    await userEvent.click(screen.getByRole('button', { name: 'Add Employee' }));
    expect(await screen.findByText('Last name is required.')).toBeInTheDocument();
  });

  it('shows validation error when email is missing', async () => {
    await renderAndOpenAddModal();
    await userEvent.type(screen.getByPlaceholderText('First name'), 'Grace');
    await userEvent.type(screen.getByPlaceholderText('Last name'), 'Hopper');
    await userEvent.click(screen.getByRole('button', { name: 'Add Employee' }));
    expect(await screen.findByText('Email is required.')).toBeInTheDocument();
  });

  it('shows validation error when hireDate is missing', async () => {
    await renderAndOpenAddModal();
    await userEvent.type(screen.getByPlaceholderText('First name'), 'Grace');
    await userEvent.type(screen.getByPlaceholderText('Last name'), 'Hopper');
    await userEvent.type(screen.getByPlaceholderText('email@example.com'), 'grace@example.com');
    await userEvent.click(screen.getByRole('button', { name: 'Add Employee' }));
    expect(await screen.findByText('Hire date is required.')).toBeInTheDocument();
  });

  it('shows validation error when sourceSystem is missing', async () => {
    await renderAndOpenAddModal();
    await userEvent.type(screen.getByPlaceholderText('First name'), 'Grace');
    await userEvent.type(screen.getByPlaceholderText('Last name'), 'Hopper');
    await userEvent.type(screen.getByPlaceholderText('email@example.com'), 'grace@example.com');
    // The hire date input is type="date"; simulate change
    await userEvent.type(
      screen.getAllByDisplayValue('').find(el => (el as HTMLInputElement).type === 'date')!,
      '2020-06-01',
    );
    await userEvent.click(screen.getByRole('button', { name: 'Add Employee' }));
    expect(await screen.findByText('Source system is required.')).toBeInTheDocument();
  });

  it('calls api.post with the correct payload on valid submit', async () => {
    mockPost.mockResolvedValueOnce({});
    // Set up a second get call for the re-fetch after successful submit
    mockGet.mockResolvedValueOnce(EMPLOYEE_LIST);

    await renderAndOpenAddModal();

    await userEvent.type(screen.getByPlaceholderText('First name'), 'Grace');
    await userEvent.type(screen.getByPlaceholderText('Last name'), 'Hopper');
    await userEvent.type(screen.getByPlaceholderText('email@example.com'), 'grace@example.com');
    await userEvent.type(screen.getByPlaceholderText('e.g. Engineer'), 'Admiral');
    await userEvent.type(screen.getByPlaceholderText('e.g. HR'), 'HRIS');

    // Set hire date
    const dateInputs = screen.getAllByDisplayValue('');
    const hireDateInput = dateInputs.find(el => (el as HTMLInputElement).type === 'date')!;
    await userEvent.type(hireDateInput, '2020-06-01');

    await userEvent.click(screen.getByRole('button', { name: 'Add Employee' }));

    expect(mockPost).toHaveBeenCalledWith('/api/employees', expect.objectContaining({
      firstName: 'Grace',
      lastName: 'Hopper',
      email: 'grace@example.com',
      jobTitle: 'Admiral',
      sourceSystem: 'HRIS',
    }));
  });

  it('closes the modal and re-fetches employees on successful submit', async () => {
    mockPost.mockResolvedValueOnce({});
    mockGet.mockResolvedValueOnce(EMPLOYEE_LIST);

    await renderAndOpenAddModal();

    await userEvent.type(screen.getByPlaceholderText('First name'), 'Grace');
    await userEvent.type(screen.getByPlaceholderText('Last name'), 'Hopper');
    await userEvent.type(screen.getByPlaceholderText('email@example.com'), 'grace@example.com');
    await userEvent.type(screen.getByPlaceholderText('e.g. HR'), 'HRIS');

    const hireDateInput = screen.getAllByDisplayValue('').find(
      el => (el as HTMLInputElement).type === 'date',
    )!;
    await userEvent.type(hireDateInput, '2020-06-01');

    await userEvent.click(screen.getByRole('button', { name: 'Add Employee' }));

    // Modal should disappear
    expect(await screen.findByText('Ada Lovelace')).toBeInTheDocument();
    expect(screen.queryByText('New Employee')).not.toBeInTheDocument();
    // employees were re-fetched
    expect(mockGet).toHaveBeenLastCalledWith('/api/employees');
  });

  it('shows submitError and keeps modal open when api.post fails', async () => {
    mockPost.mockRejectedValueOnce(new Error('Server error'));

    await renderAndOpenAddModal();

    await userEvent.type(screen.getByPlaceholderText('First name'), 'Grace');
    await userEvent.type(screen.getByPlaceholderText('Last name'), 'Hopper');
    await userEvent.type(screen.getByPlaceholderText('email@example.com'), 'grace@example.com');
    await userEvent.type(screen.getByPlaceholderText('e.g. HR'), 'HRIS');

    const hireDateInput = screen.getAllByDisplayValue('').find(
      el => (el as HTMLInputElement).type === 'date',
    )!;
    await userEvent.type(hireDateInput, '2020-06-01');

    await userEvent.click(screen.getByRole('button', { name: 'Add Employee' }));

    expect(await screen.findByText('Server error')).toBeInTheDocument();
    // Modal must still be visible
    expect(screen.getByText('New Employee')).toBeInTheDocument();
  });

  it('defaults status select to ACTIVE', async () => {
    await renderAndOpenAddModal();
    const selects = screen.getAllByRole('combobox');
    expect((selects[0] as HTMLSelectElement).value).toBe('ACTIVE');
  });

  it('does not call api.post when modal is cancelled', async () => {
    await renderAndOpenAddModal();
    await userEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(mockPost).not.toHaveBeenCalled();
  });
});

describe('In-place Edit', () => {
  it('shows an Edit button when a snapshot is loaded', async () => {
    await renderAndSelectAda();
    expect(screen.getByRole('button', { name: 'Edit' })).toBeInTheDocument();
  });

  it('does not show Edit button before a snapshot is loaded', async () => {
    mockGet.mockResolvedValueOnce(EMPLOYEE_LIST);
    render(<MemoryRouter><App /></MemoryRouter>);
    await screen.findByText('Ada Lovelace');
    expect(screen.queryByRole('button', { name: 'Edit' })).not.toBeInTheDocument();
  });

  it('switches to edit mode and shows Save and Cancel buttons', async () => {
    await renderAndSelectAda();
    await userEvent.click(screen.getByRole('button', { name: 'Edit' }));
    expect(screen.getByRole('button', { name: 'Save' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Edit' })).not.toBeInTheDocument();
  });

  it('renders text inputs for first_name and last_name in edit mode', async () => {
    await renderAndSelectAda();
    await userEvent.click(screen.getByRole('button', { name: 'Edit' }));
    expect(screen.getByDisplayValue('Ada')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Lovelace')).toBeInTheDocument();
  });

  it('renders text input for email in edit mode', async () => {
    await renderAndSelectAda();
    await userEvent.click(screen.getByRole('button', { name: 'Edit' }));
    expect(screen.getByDisplayValue('ada@example.com')).toBeInTheDocument();
  });

  it('renders text input for job_title in edit mode', async () => {
    await renderAndSelectAda();
    await userEvent.click(screen.getByRole('button', { name: 'Edit' }));
    expect(screen.getByDisplayValue('Engineer')).toBeInTheDocument();
  });

  it('renders date input for hire_date in edit mode', async () => {
    await renderAndSelectAda();
    await userEvent.click(screen.getByRole('button', { name: 'Edit' }));
    const hireDateInput = screen.getByDisplayValue('2020-01-01') as HTMLInputElement;
    expect(hireDateInput).toBeInTheDocument();
    expect(hireDateInput.type).toBe('date');
  });

  it('renders number input for salary in edit mode (not blurred)', async () => {
    await renderAndSelectAda();
    await userEvent.click(screen.getByRole('button', { name: 'Edit' }));
    const salaryInput = screen.getByDisplayValue('90000') as HTMLInputElement;
    expect(salaryInput).toBeInTheDocument();
    expect(salaryInput.type).toBe('number');
    // The blurred <p> should not be present in edit mode
    expect(screen.queryByText('90000', { selector: 'p' })).not.toBeInTheDocument();
  });

  it('renders status select with current value in edit mode', async () => {
    await renderAndSelectAda();
    await userEvent.click(screen.getByRole('button', { name: 'Edit' }));
    const selects = screen.getAllByRole('combobox');
    const statusSelect = selects.find(
      el => (el as HTMLSelectElement).value === 'ACTIVE',
    );
    expect(statusSelect).toBeInTheDocument();
  });

  it('Cancel exits edit mode without calling api.put', async () => {
    await renderAndSelectAda();
    await userEvent.click(screen.getByRole('button', { name: 'Edit' }));
    await userEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(mockPut).not.toHaveBeenCalled();
    expect(screen.getByRole('button', { name: 'Edit' })).toBeInTheDocument();
  });

  it('Cancel restores read-mode display values', async () => {
    await renderAndSelectAda();
    await userEvent.click(screen.getByRole('button', { name: 'Edit' }));
    // Mutate the first name field
    const firstNameInput = screen.getByDisplayValue('Ada');
    await userEvent.clear(firstNameInput);
    await userEvent.type(firstNameInput, 'Changed');
    // Cancel — original name should be visible as text again
    await userEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(screen.queryByDisplayValue('Changed')).not.toBeInTheDocument();
  });

  it('shows a validation error when first_name is cleared before saving', async () => {
    await renderAndSelectAda();
    await userEvent.click(screen.getByRole('button', { name: 'Edit' }));
    const firstNameInput = screen.getByDisplayValue('Ada');
    await userEvent.clear(firstNameInput);
    await userEvent.click(screen.getByRole('button', { name: 'Save' }));
    expect(await screen.findByText('First name is required.')).toBeInTheDocument();
    expect(mockPut).not.toHaveBeenCalled();
  });

  it('shows a validation error when last_name is cleared', async () => {
    await renderAndSelectAda();
    await userEvent.click(screen.getByRole('button', { name: 'Edit' }));
    const lastNameInput = screen.getByDisplayValue('Lovelace');
    await userEvent.clear(lastNameInput);
    await userEvent.click(screen.getByRole('button', { name: 'Save' }));
    expect(await screen.findByText('Last name is required.')).toBeInTheDocument();
  });

  it('shows a validation error when email is cleared', async () => {
    await renderAndSelectAda();
    await userEvent.click(screen.getByRole('button', { name: 'Edit' }));
    const emailInput = screen.getByDisplayValue('ada@example.com');
    await userEvent.clear(emailInput);
    await userEvent.click(screen.getByRole('button', { name: 'Save' }));
    expect(await screen.findByText('Email is required.')).toBeInTheDocument();
  });

  it('calls api.put with the correct endpoint and payload on valid save', async () => {
    mockPut.mockResolvedValueOnce({});
    // After save: loadEmployees() + snapshot re-fetch
    mockGet
      .mockResolvedValueOnce(EMPLOYEE_LIST)
      .mockResolvedValueOnce(SNAPSHOT);

    await renderAndSelectAda();
    await userEvent.click(screen.getByRole('button', { name: 'Edit' }));

    const jobTitleInput = screen.getByDisplayValue('Engineer');
    await userEvent.clear(jobTitleInput);
    await userEvent.type(jobTitleInput, 'Senior Engineer');

    await userEvent.click(screen.getByRole('button', { name: 'Save' }));

    expect(mockPut).toHaveBeenCalledWith(
      '/api/employees/1',
      expect.objectContaining({
        firstName: 'Ada',
        lastName: 'Lovelace',
        email: 'ada@example.com',
        jobTitle: 'Senior Engineer',
        sourceSystem: 'HR',
      }),
    );
  });

  it('exits edit mode and re-fetches data on successful save', async () => {
    mockPut.mockResolvedValueOnce({});
    mockGet
      .mockResolvedValueOnce(EMPLOYEE_LIST)
      .mockResolvedValueOnce(SNAPSHOT);

    await renderAndSelectAda();
    await userEvent.click(screen.getByRole('button', { name: 'Edit' }));
    await userEvent.click(screen.getByRole('button', { name: 'Save' }));

    // Edit mode should be gone
    expect(await screen.findByRole('button', { name: 'Edit' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Save' })).not.toBeInTheDocument();
    // employees and snapshot were re-fetched
    expect(mockGet).toHaveBeenCalledWith('/api/employees');
    expect(mockGet).toHaveBeenCalledWith('/api/employees/1/snapshot');
  });

  it('shows an error and keeps edit mode when api.put fails', async () => {
    mockPut.mockRejectedValueOnce(new Error('Update failed'));

    await renderAndSelectAda();
    await userEvent.click(screen.getByRole('button', { name: 'Edit' }));
    await userEvent.click(screen.getByRole('button', { name: 'Save' }));

    expect(await screen.findByText('Update failed')).toBeInTheDocument();
    // Still in edit mode
    expect(screen.getByRole('button', { name: 'Save' })).toBeInTheDocument();
  });

  it('prompts confirm when navigating away with unsaved changes', async () => {
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(false);
    // Need a second snapshot resolved value so Alan's click could proceed
    mockGet
      .mockResolvedValueOnce(EMPLOYEE_LIST)
      .mockResolvedValueOnce(SNAPSHOT);

    render(<MemoryRouter><App /></MemoryRouter>);
    await screen.findByText('Ada Lovelace');
    await userEvent.click(screen.getByText('Ada Lovelace'));
    await screen.findByText('2020-01-01');

    await userEvent.click(screen.getByRole('button', { name: 'Edit' }));
    // Make a change so hasChanges() returns true
    const firstNameInput = screen.getByDisplayValue('Ada');
    await userEvent.clear(firstNameInput);
    await userEvent.type(firstNameInput, 'Changed');

    // Click on Alan — should trigger confirm
    await userEvent.click(screen.getByText('Alan Turing'));
    expect(confirmSpy).toHaveBeenCalledWith('You have unsaved changes. Discard them?');

    confirmSpy.mockRestore();
  });

  it('stays on current employee when confirm is declined', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(false);
    mockGet
      .mockResolvedValueOnce(EMPLOYEE_LIST)
      .mockResolvedValueOnce(SNAPSHOT);

    render(<MemoryRouter><App /></MemoryRouter>);
    await screen.findByText('Ada Lovelace');
    await userEvent.click(screen.getByText('Ada Lovelace'));
    await screen.findByText('2020-01-01');

    await userEvent.click(screen.getByRole('button', { name: 'Edit' }));
    const firstNameInput = screen.getByDisplayValue('Ada');
    await userEvent.clear(firstNameInput);
    await userEvent.type(firstNameInput, 'Changed');

    await userEvent.click(screen.getByText('Alan Turing'));

    // Still showing Ada's snapshot — snapshot fetch for Alan was NOT made
    expect(mockGet).not.toHaveBeenCalledWith('/api/employees/2/snapshot');
    // Input for Changed should still be visible
    expect(screen.getByDisplayValue('Changed')).toBeInTheDocument();
  });

  it('switches employee when confirm is accepted', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    mockGet
      .mockResolvedValueOnce(EMPLOYEE_LIST)
      .mockResolvedValueOnce(SNAPSHOT)
      .mockResolvedValueOnce(new Promise(() => {})); // Alan's snapshot — keep loading

    render(<MemoryRouter><App /></MemoryRouter>);
    await screen.findByText('Ada Lovelace');
    await userEvent.click(screen.getByText('Ada Lovelace'));
    await screen.findByText('2020-01-01');

    await userEvent.click(screen.getByRole('button', { name: 'Edit' }));
    const firstNameInput = screen.getByDisplayValue('Ada');
    await userEvent.clear(firstNameInput);
    await userEvent.type(firstNameInput, 'Changed');

    await userEvent.click(screen.getByText('Alan Turing'));

    expect(mockGet).toHaveBeenCalledWith('/api/employees/2/snapshot');
  });

  it('does not prompt confirm when navigating away without unsaved changes', async () => {
    const confirmSpy = vi.spyOn(window, 'confirm');
    mockGet
      .mockResolvedValueOnce(EMPLOYEE_LIST)
      .mockResolvedValueOnce(SNAPSHOT)
      .mockResolvedValueOnce(new Promise(() => {})); // Alan's snapshot

    render(<MemoryRouter><App /></MemoryRouter>);
    await screen.findByText('Ada Lovelace');
    await userEvent.click(screen.getByText('Ada Lovelace'));
    await screen.findByText('2020-01-01');

    // Enter and immediately exit edit mode without changing anything
    await userEvent.click(screen.getByRole('button', { name: 'Edit' }));
    await userEvent.click(screen.getByRole('button', { name: 'Cancel' }));

    await userEvent.click(screen.getByText('Alan Turing'));

    expect(confirmSpy).not.toHaveBeenCalled();
    confirmSpy.mockRestore();
  });
});
