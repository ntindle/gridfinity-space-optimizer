/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ShareLayoutButton from './ShareLayoutButton';
import { SettingsProvider } from '@/contexts/SettingsContext';

const renderWithProviders = () =>
  render(
    <SettingsProvider>
      <ShareLayoutButton />
    </SettingsProvider>,
  );

describe('ShareLayoutButton', () => {
  const writeText = vi.fn().mockResolvedValue(undefined);

  beforeEach(() => {
    vi.clearAllMocks();
    writeText.mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText },
      configurable: true,
    });
  });

  it('copies a share link containing the current settings and shows confirmation', async () => {
    renderWithProviders();

    // NOTE: fireEvent, not userEvent — userEvent.setup() installs its own
    // navigator.clipboard stub, which would shadow the mock above.
    fireEvent.click(screen.getByRole('button', { name: /copy share link/i }));

    await waitFor(() => {
      expect(writeText).toHaveBeenCalledTimes(1);
    });
    const copied = writeText.mock.calls[0][0] as string;
    expect(copied).toContain('share=');
    expect(copied.startsWith(window.location.origin)).toBe(true);
    expect(screen.getByText('Link copied!')).toBeInTheDocument();
  });

  it('shows an error state when copying fails', async () => {
    writeText.mockRejectedValueOnce(new Error('denied'));
    // No execCommand fallback in jsdom.
    renderWithProviders();

    fireEvent.click(screen.getByRole('button', { name: /copy share link/i }));

    await waitFor(() => {
      expect(screen.getByText(/couldn’t copy the link/i)).toBeInTheDocument();
    });
  });
});
