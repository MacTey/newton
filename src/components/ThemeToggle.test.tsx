import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ThemeToggle from './ThemeToggle';

beforeEach(() => {
  localStorage.clear();
  document.documentElement.classList.remove('dark');
});

describe('ThemeToggle', () => {
  it('starts in light mode when localStorage has no value', () => {
    render(<ThemeToggle />);
    expect(screen.getByRole('button', { name: 'Toggle dark mode' })).toHaveTextContent('☾ Dark');
    expect(document.documentElement.classList.contains('dark')).toBe(false);
  });

  it('starts in dark mode when localStorage is set to dark', () => {
    localStorage.setItem('theme', 'dark');
    render(<ThemeToggle />);
    expect(screen.getByRole('button', { name: 'Toggle dark mode' })).toHaveTextContent('☀ Light');
    expect(document.documentElement.classList.contains('dark')).toBe(true);
  });

  it('toggles to dark mode on click and persists to localStorage', async () => {
    render(<ThemeToggle />);
    const button = screen.getByRole('button', { name: 'Toggle dark mode' });

    await userEvent.click(button);

    expect(button).toHaveTextContent('☀ Light');
    expect(document.documentElement.classList.contains('dark')).toBe(true);
    expect(localStorage.getItem('theme')).toBe('dark');
  });

  it('toggles back to light mode on second click', async () => {
    render(<ThemeToggle />);
    const button = screen.getByRole('button', { name: 'Toggle dark mode' });

    await userEvent.click(button);
    await userEvent.click(button);

    expect(button).toHaveTextContent('☾ Dark');
    expect(document.documentElement.classList.contains('dark')).toBe(false);
    expect(localStorage.getItem('theme')).toBe('light');
  });
});
