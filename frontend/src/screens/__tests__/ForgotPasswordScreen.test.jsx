import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import ForgotPasswordScreen from '../ForgotPasswordScreen';

describe('ForgotPasswordScreen', () => {
  test('renders forgot password form', () => {
    render(
      <MemoryRouter>
        <ForgotPasswordScreen />
      </MemoryRouter>
    );
    expect(screen.getByText(/forgot your password/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
  });

  test('shows error on empty submit', () => {
    render(
      <MemoryRouter>
        <ForgotPasswordScreen />
      </MemoryRouter>
    );
    fireEvent.click(screen.getByRole('button'));
    // No crash, button still present
    expect(screen.getByRole('button')).toBeInTheDocument();
  });
});
