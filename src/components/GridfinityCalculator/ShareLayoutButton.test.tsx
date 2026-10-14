/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ShareLayoutButton from './ShareLayoutButton';
import { SettingsProvider } from '@/contexts/SettingsContext';
import { decodeShareSettings } from '@/utils/shareLayout';

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
    // The copied link must decode back to the settings on screen — a
    // button that copied `?share=garbage` must not pass this test.
    const decoded = decodeShareSettings(new URL(copied).searchParams.get('share'));
    expect(decoded).toEqual({
      drawerSize: { width: 22.5, height: 16.5 },
      selectedPrinter: 'Bambu Lab A1',
      customPrinterSize: null,
      useHalfSize: false,
      preferHalfSize: false,
      preferUniformBaseplates: false,
      numDrawers: 1,
      useMm: false,
    });
    expect(screen.getByText('Link copied!')).toBeInTheDocument();
  });

  it('shows an error state when copying fails', async () => {
    writeText.mockRejectedValueOnce(new Error('denied'));
    // No execCommand fallback in jsdom.
    renderWithProviders();

    fireEvent.click(screen.getByRole('button', { name: /copy share link/i }));

    await waitFor(() => {
      expect(screen.getByText(/copy failed/i)).toBeInTheDocument();
    });
    // The failure UI must offer the real link to copy manually — the
    // address bar never contains one, so pointing the user there is wrong.
    const fallback = screen.getByLabelText(/share link.*select and copy manually/i);
    expect((fallback as HTMLInputElement).value).toContain('share=');
    expect(decodeShareSettings(new URL((fallback as HTMLInputElement).value).searchParams.get('share'))).not.toBeNull();
  });
});
