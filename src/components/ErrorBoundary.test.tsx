/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ErrorBoundary from './ErrorBoundary';
import { loadUserSettings } from '@/lib/utils';

const Broken = () => {
  throw new Error('bad saved settings');
};

const silenceUncaught = (event: ErrorEvent) => event.preventDefault();

describe('ErrorBoundary', () => {
  beforeEach(() => {
    window.addEventListener('error', silenceUncaught);
  });

  afterEach(() => {
    window.removeEventListener('error', silenceUncaught);
    vi.restoreAllMocks();
  });

  it('shows a recovery screen instead of a blank page', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    render(
      <ErrorBoundary>
        <Broken />
      </ErrorBoundary>
    );
    expect(screen.getByRole('alert')).toHaveTextContent('Something went wrong');
    expect(screen.getByRole('button', { name: 'Reset saved settings' })).toBeInTheDocument();
  });

  it('clears only this app’s saved settings when reset', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const store: Record<string, string> = {
      gridfinity_drawerSize: '{}',
      gridfinitySettings: '{not json',
      unrelated: 'keep',
    };
    const removeItem = vi.fn((key: string) => {
      delete store[key];
    });
    const original = globalThis.localStorage;
    vi.stubGlobal('localStorage', Object.assign(Object.create({ removeItem }), store));
    const reload = vi.fn();
    vi.spyOn(window, 'location', 'get').mockReturnValue({ ...window.location, reload });

    try {
      render(
        <ErrorBoundary>
          <Broken />
        </ErrorBoundary>
      );
      await userEvent.click(screen.getByRole('button', { name: 'Reset saved settings' }));

      expect(removeItem).toHaveBeenCalledWith('gridfinity_drawerSize');
      expect(removeItem).toHaveBeenCalledWith('gridfinitySettings');
      expect(removeItem).not.toHaveBeenCalledWith('unrelated');
      expect(reload).toHaveBeenCalled();
    } finally {
      vi.stubGlobal('localStorage', original);
    }
  });
});

describe('loadUserSettings', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('returns null for corrupt saved settings instead of throwing', () => {
    vi.mocked(localStorage.getItem).mockReturnValueOnce('{not json');
    expect(loadUserSettings()).toBeNull();
  });
});
