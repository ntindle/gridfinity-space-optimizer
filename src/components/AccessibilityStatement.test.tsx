/**
 * @vitest-environment jsdom
 */
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import AccessibilityStatement from '@/components/AccessibilityStatement';

describe('AccessibilityStatement', () => {
  it('renders a labelled section with the statement', () => {
    render(<AccessibilityStatement />);
    const section = document.getElementById('accessibility');
    expect(section).not.toBeNull();
    expect(section?.getAttribute('aria-labelledby')).toBe(
      'accessibility-heading'
    );
    expect(
      screen.getByRole('heading', { name: 'Accessibility' })
    ).toBeInTheDocument();
  });

  it('links to the issue tracker for reporting barriers', () => {
    render(<AccessibilityStatement />);
    const link = screen.getByRole('link', {
      name: 'ntindle/gridfinity-space-optimizer',
    });
    expect(link).toHaveAttribute(
      'href',
      'https://github.com/ntindle/gridfinity-space-optimizer/issues'
    );
  });
});
