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
  },
}));

import { api } from './api/client';
const mockGet = vi.mocked(api.get);

const EMPLOYEE_LIST = [
  { employeeId: 1, firstName: 'Ada', lastName: 'Lovelace' },
  { employeeId: 2, firstName: 'Alan', lastName: 'Turing' },
];

const SNAPSHOT = {
  employee_id: '1',
  first_name: 'Ada',
  last_name: 'Lovelace',
  job_title: 'Engineer',
  department: 'R&D',
  status: 'Active',
  email: 'ada@example.com',
  phone: null,
  location: 'London',
  hire_date: '2020-01-01',
  salary: 90000,
  manager_name: null,
  race: 'Unknown',
  skills: ['TypeScript', 'React'],
  certifications: ['AWS'],
  snapshot_metadata: {
    generated_at: '2024-01-01T00:00:00Z',
    snapshot_time: '2024-01-01T00:00:00Z',
  },
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

  it('renders snapshot fields after selecting an employee', async () => {
    mockGet
      .mockResolvedValueOnce(EMPLOYEE_LIST)
      .mockResolvedValueOnce(SNAPSHOT);

    render(<MemoryRouter><App /></MemoryRouter>);
    await screen.findByText('Ada Lovelace');
    await userEvent.click(screen.getByText('Ada Lovelace'));

    expect(await screen.findByText('Engineer · R&D')).toBeInTheDocument();
  });

  it('does not render snapshot_metadata as a table row', async () => {
    mockGet
      .mockResolvedValueOnce(EMPLOYEE_LIST)
      .mockResolvedValueOnce(SNAPSHOT);

    render(<MemoryRouter><App /></MemoryRouter>);
    await screen.findByText('Ada Lovelace');
    await userEvent.click(screen.getByText('Ada Lovelace'));

    await screen.findByText('Engineer · R&D');
    expect(screen.queryByText('snapshot metadata')).not.toBeInTheDocument();
  });

  it('renders skills as tags', async () => {
    mockGet
      .mockResolvedValueOnce(EMPLOYEE_LIST)
      .mockResolvedValueOnce(SNAPSHOT);

    render(<MemoryRouter><App /></MemoryRouter>);
    await screen.findByText('Ada Lovelace');
    await userEvent.click(screen.getByText('Ada Lovelace'));

    expect(await screen.findByText('TypeScript')).toBeInTheDocument();
    expect(screen.getByText('React')).toBeInTheDocument();
  });

  it('renders certifications as tags', async () => {
    mockGet
      .mockResolvedValueOnce(EMPLOYEE_LIST)
      .mockResolvedValueOnce(SNAPSHOT);

    render(<MemoryRouter><App /></MemoryRouter>);
    await screen.findByText('Ada Lovelace');
    await userEvent.click(screen.getByText('Ada Lovelace'));

    expect(await screen.findByText('AWS')).toBeInTheDocument();
  });

  it('renders em dash for null phone field', async () => {
    mockGet
      .mockResolvedValueOnce(EMPLOYEE_LIST)
      .mockResolvedValueOnce(SNAPSHOT);

    render(<MemoryRouter><App /></MemoryRouter>);
    await screen.findByText('Ada Lovelace');
    await userEvent.click(screen.getByText('Ada Lovelace'));

    await screen.findByText('Engineer · R&D');
    expect(screen.getAllByText('—').length).toBeGreaterThan(0);
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
