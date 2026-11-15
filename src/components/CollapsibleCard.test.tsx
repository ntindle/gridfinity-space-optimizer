/**
 * @vitest-environment jsdom
 */
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import CollapsibleCard from './CollapsibleCard';

describe('CollapsibleCard', () => {
  it('renders the mobile toggle button and the desktop heading', () => {
    render(
      <CollapsibleCard title="Drawer Dimensions">
        <p>card body</p>
      </CollapsibleCard>
    );
    expect(
      screen.getByRole('button', { name: 'Drawer Dimensions' })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: 'Drawer Dimensions' })
    ).toBeInTheDocument();
    expect(screen.getByText('card body')).toBeInTheDocument();
  });

  it('starts open by default', () => {
    render(
      <CollapsibleCard title="Bin Options">
        <p>card body</p>
      </CollapsibleCard>
    );
    expect(
      screen.getByRole('button', { name: 'Bin Options' })
    ).toHaveAttribute('aria-expanded', 'true');
  });

  it('toggles the panel and aria-expanded when the mobile button is clicked', async () => {
    const user = userEvent.setup();
    render(
      <CollapsibleCard title="Printer Settings" defaultOpen={false}>
        <p>card body</p>
      </CollapsibleCard>
    );
    const button = screen.getByRole('button', { name: 'Printer Settings' });
    expect(button).toHaveAttribute('aria-expanded', 'false');

    await user.click(button);
    expect(button).toHaveAttribute('aria-expanded', 'true');

    await user.click(button);
    expect(button).toHaveAttribute('aria-expanded', 'false');
  });

  it('links the toggle button to the panel with aria-controls', () => {
    render(
      <CollapsibleCard title="Drawer Options">
        <p>card body</p>
      </CollapsibleCard>
    );
    const button = screen.getByRole('button', { name: 'Drawer Options' });
    const panelId = button.getAttribute('aria-controls');
    expect(panelId).toBeTruthy();
    expect(document.getElementById(panelId as string)).toBeInTheDocument();
  });

  it('passes the tour id through as data-tour on the section', () => {
    const { container } = render(
      <CollapsibleCard title="Drawer Dimensions" tourId="drawer">
        <p>card body</p>
      </CollapsibleCard>
    );
    expect(
      container.querySelector('[data-tour="drawer"]')
    ).toBeInTheDocument();
  });

  it('gives the mobile toggle an explicit focus-visible ring', () => {
    render(
      <CollapsibleCard title="Drawer Dimensions">
        <p>card body</p>
      </CollapsibleCard>
    );
    const toggle = screen.getByRole('button', { name: 'Drawer Dimensions' });
    expect(toggle.className).toContain('focus-visible:ring-2');
  });
});
