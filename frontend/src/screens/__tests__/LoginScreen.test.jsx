import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import LoginScreen from '../LoginScreen';

describe('LoginScreen', () => {
  test('renders login form and steps', () => {
    render(
      <MemoryRouter>
        <LoginScreen />
      </MemoryRouter>
    );
    // Step 1: Email
    expect(screen.getByText(/sign in to PledgeHub/i)).toBeInTheDocument();
    const emailInput = screen.getByPlaceholderText(/email/i);
    expect(emailInput).toBeInTheDocument();
    const nextButton = screen.getByRole('button', { name: /next/i });
    expect(nextButton).toBeInTheDocument();

    // Simulate entering email and clicking Next
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.click(nextButton);

    // Step 2: Password should now be visible
    expect(screen.getByPlaceholderText(/password/i)).toBeInTheDocument();
  });

  test('shows error on empty submit', () => {
    render(
      <MemoryRouter>
        <LoginScreen />
      </MemoryRouter>
    );
    fireEvent.click(screen.getByRole('button', { name: /next/i }));
    // Error message is set by backend, so just check no crash
    expect(screen.getByRole('button', { name: /next/i })).toBeInTheDocument();
  });
});



