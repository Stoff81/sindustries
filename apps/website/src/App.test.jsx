import { beforeEach, describe, expect, test } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { App } from './App.jsx';

describe('website app', () => {
  beforeEach(() => {
    window.history.pushState({}, '', '/');
  });

  test('renders home messaging', () => {
    render(<App />);
    expect(screen.getByRole('heading', { name: /build useful things\. run them well\./i })).toBeInTheDocument();
    expect(screen.getByText(/practical digital products, internal tools, and operating systems/i)).toBeInTheDocument();
  });

  test('navigates to about and contact routes', async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole('link', { name: /about/i }));
    expect(screen.getByText(/founder note/i)).toBeInTheDocument();

    await user.click(screen.getByRole('link', { name: /contact/i }));
    expect(screen.getByText(/what to include/i)).toBeInTheDocument();
    expect(screen.getAllByRole('link', { name: /tom@stofferindustries.com/i }).length).toBeGreaterThan(0);
  });

  test('renders token specimen route', async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole('link', { name: /tokens/i }));
    expect(screen.getByRole('heading', { name: /css token specimen/i })).toBeInTheDocument();
    expect(screen.getByText(/component sample/i)).toBeInTheDocument();
  });
});
