/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import GuidedTour from './GuidedTour';

const ALL_ANCHORS = ['drawer', 'printer', 'bins', 'results', 'share'];

const renderAnchors = (ids: string[] = ALL_ANCHORS) => {
  render(
    <>
      {ids.map((id) => (
        <div key={id} data-tour={id}>
          anchor {id}
        </div>
      ))}
    </>,
  );
};

describe('GuidedTour', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders nothing when closed', () => {
    render(<GuidedTour open={false} onClose={vi.fn()} />);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('opens at step 1 with the right title and indicator', () => {
    renderAnchors();
    render(<GuidedTour open onClose={vi.fn()} />);
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('Measure your drawer')).toBeInTheDocument();
    expect(screen.getByText('Step 1 of 5')).toBeInTheDocument();
  });

  it('moves forward and back through steps and updates the indicator', async () => {
    const user = userEvent.setup();
    renderAnchors();
    render(<GuidedTour open onClose={vi.fn()} />);

    await user.click(screen.getByRole('button', { name: 'Next' }));
    expect(screen.getByText('Pick your printer')).toBeInTheDocument();
    expect(screen.getByText('Step 2 of 5')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Next' }));
    expect(screen.getByText('Tune the bins')).toBeInTheDocument();
    expect(screen.getByText('Step 3 of 5')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Back' }));
    expect(screen.getByText('Pick your printer')).toBeInTheDocument();
    expect(screen.getByText('Step 2 of 5')).toBeInTheDocument();
  });

  it('labels the last step button Done and calls onClose', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    renderAnchors();
    render(<GuidedTour open onClose={onClose} />);

    for (let i = 0; i < 4; i += 1) {
      await user.click(screen.getByRole('button', { name: 'Next' }));
    }
    expect(screen.getByText('Share or print labels')).toBeInTheDocument();
    expect(screen.getByText('Step 5 of 5')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Done' }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('calls onClose when Skip tour is clicked', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    renderAnchors();
    render(<GuidedTour open onClose={onClose} />);

    await user.click(screen.getByRole('button', { name: 'Skip tour' }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('calls onClose on Escape', () => {
    const onClose = vi.fn();
    renderAnchors();
    render(<GuidedTour open onClose={onClose} />);

    fireEvent.keyDown(window, { key: 'Escape' });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('calls onClose when the backdrop is clicked', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    renderAnchors();
    render(<GuidedTour open onClose={onClose} />);

    await user.click(screen.getByTestId('guided-tour-backdrop'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('skips a step whose anchor is missing from the DOM', async () => {
    const user = userEvent.setup();
    renderAnchors(['drawer', 'results', 'share']);
    render(<GuidedTour open onClose={vi.fn()} />);

    await user.click(screen.getByRole('button', { name: 'Next' }));
    expect(screen.getByText('Read the layout')).toBeInTheDocument();
    expect(screen.getByText('Step 4 of 5')).toBeInTheDocument();
  });

  it('skips backward over a missing anchor when going back', async () => {
    const user = userEvent.setup();
    renderAnchors(['drawer', 'printer', 'bins', 'share']);
    render(<GuidedTour open onClose={vi.fn()} />);

    for (let i = 0; i < 3; i += 1) {
      await user.click(screen.getByRole('button', { name: 'Next' }));
    }
    expect(screen.getByText('Share or print labels')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Back' }));
    expect(screen.getByText('Tune the bins')).toBeInTheDocument();
    expect(screen.getByText('Step 3 of 5')).toBeInTheDocument();
  });

  it('calls onClose when no anchors remain', () => {
    const onClose = vi.fn();
    render(<GuidedTour open onClose={onClose} />);
    expect(onClose).toHaveBeenCalled();
  });

  it('moves focus into the dialog on open and restores it on close', () => {
    const onClose = vi.fn();
    render(<button type="button">outside</button>);
    const outside = screen.getByRole('button', { name: 'outside' });
    outside.focus();
    expect(outside).toHaveFocus();

    const { rerender } = render(<GuidedTour open={false} onClose={onClose} />);
    rerender(<GuidedTour open onClose={onClose} />);
    expect(screen.getByRole('dialog')).toHaveFocus();

    rerender(<GuidedTour open={false} onClose={onClose} />);
    expect(outside).toHaveFocus();
  });

  it('resets to step 1 when reopened', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    renderAnchors();
    const { rerender } = render(<GuidedTour open onClose={onClose} />);

    await user.click(screen.getByRole('button', { name: 'Next' }));
    expect(screen.getByText('Pick your printer')).toBeInTheDocument();

    rerender(<GuidedTour open={false} onClose={onClose} />);
    rerender(<GuidedTour open onClose={onClose} />);
    expect(screen.getByText('Measure your drawer')).toBeInTheDocument();
    expect(screen.getByText('Step 1 of 5')).toBeInTheDocument();
  });
});
