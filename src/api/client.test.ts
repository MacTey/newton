import { describe, it, expect, vi, beforeEach } from 'vitest';
import { api } from './client';

const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

function makeResponse(ok: boolean, data: unknown, status = 200, statusText = 'OK') {
  return Promise.resolve({
    ok,
    status,
    statusText,
    json: () => Promise.resolve(data),
  });
}

beforeEach(() => {
  mockFetch.mockReset();
});

describe('api.get', () => {
  it('resolves with parsed JSON on success', async () => {
    const data = [{ employeeId: 1, firstName: 'Ada' }];
    mockFetch.mockReturnValue(makeResponse(true, data));

    const result = await api.get('/api/employees');

    expect(result).toEqual(data);
    expect(mockFetch).toHaveBeenCalledWith(
      'http://localhost:8080/api/employees',
      expect.objectContaining({ headers: { 'Content-Type': 'application/json' } })
    );
  });

  it('throws with status message on non-OK response', async () => {
    mockFetch.mockReturnValue(makeResponse(false, null, 404, 'Not Found'));

    await expect(api.get('/api/employees')).rejects.toThrow('API error 404: Not Found');
  });
});

describe('api.post', () => {
  it('sends POST with serialized body', async () => {
    mockFetch.mockReturnValue(makeResponse(true, { id: 2 }));

    await api.post('/api/employees', { firstName: 'Ada' });

    expect(mockFetch).toHaveBeenCalledWith(
      'http://localhost:8080/api/employees',
      expect.objectContaining({ method: 'POST', body: '{"firstName":"Ada"}' })
    );
  });
});

describe('api.put', () => {
  it('sends PUT with serialized body', async () => {
    mockFetch.mockReturnValue(makeResponse(true, {}));

    await api.put('/api/employees/1', { firstName: 'Ada' });

    expect(mockFetch).toHaveBeenCalledWith(
      'http://localhost:8080/api/employees/1',
      expect.objectContaining({ method: 'PUT', body: '{"firstName":"Ada"}' })
    );
  });
});

describe('api.delete', () => {
  it('sends DELETE request', async () => {
    mockFetch.mockReturnValue(makeResponse(true, {}));

    await api.delete('/api/employees/1');

    expect(mockFetch).toHaveBeenCalledWith(
      'http://localhost:8080/api/employees/1',
      expect.objectContaining({ method: 'DELETE' })
    );
  });
});
