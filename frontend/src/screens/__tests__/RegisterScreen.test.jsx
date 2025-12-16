import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import RegisterScreen from '../RegisterScreen';

describe('RegisterScreen', () => {
  test('renders registration form', () => {
    render(
      <MemoryRouter>
        <RegisterScreen disableRequired={true} />
      </MemoryRouter>
    );
    expect(screen.getByText(/create your PledgeHub account/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/first name/i)).toBeInTheDocument();
  });

  test('shows error on empty submit', async () => {
    render(
      <MemoryRouter>
        <RegisterScreen disableRequired={true} />
      </MemoryRouter>
    );
    // Click the 'Register' button (submit)
    fireEvent.click(screen.getByRole('button', { name: /register/i }));
    expect(await screen.findByText(/first name is required/i)).toBeInTheDocument();
  });
  test('shows error for invalid phone', async () => {
    render(
      <MemoryRouter>
        <RegisterScreen disableRequired={true} />
      </MemoryRouter>
    );
    fireEvent.change(screen.getByLabelText(/first name/i), { target: { value: 'John' } });
    fireEvent.change(screen.getByLabelText(/last name/i), { target: { value: 'Doe' } });
    fireEvent.change(screen.getByLabelText(/phone number/i), { target: { value: '12345' } });
    fireEvent.change(screen.getByLabelText(/^password$/i), { target: { value: 'password123' } });
    fireEvent.change(screen.getByLabelText(/confirm password/i), { target: { value: 'password123' } });
    fireEvent.click(screen.getByRole('button', { name: /register/i }));
    expect(await screen.findByText(/phone number must be in format/i)).toBeInTheDocument();
  });

  test('shows error for invalid email', async () => {
    render(
      <MemoryRouter>
        <RegisterScreen disableRequired={true} />
      </MemoryRouter>
    );
    fireEvent.change(screen.getByLabelText(/first name/i), { target: { value: 'John' } });
    fireEvent.change(screen.getByLabelText(/last name/i), { target: { value: 'Doe' } });
    fireEvent.change(screen.getByLabelText(/phone number/i), { target: { value: '+256771234567' } });
    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'notanemail' } });
    fireEvent.change(screen.getByLabelText(/^password$/i), { target: { value: 'password123' } });
    fireEvent.change(screen.getByLabelText(/confirm password/i), { target: { value: 'password123' } });
    fireEvent.click(screen.getByRole('button', { name: /register/i }));
    expect(await screen.findByText(/invalid email address/i)).toBeInTheDocument();
  });

  test('shows error for password mismatch', async () => {
    render(
      <MemoryRouter>
        <RegisterScreen disableRequired={true} />
      </MemoryRouter>
    );
    fireEvent.change(screen.getByLabelText(/first name/i), { target: { value: 'John' } });
    fireEvent.change(screen.getByLabelText(/last name/i), { target: { value: 'Doe' } });
    fireEvent.change(screen.getByLabelText(/phone number/i), { target: { value: '+256771234567' } });
    fireEvent.change(screen.getByLabelText(/^password$/i), { target: { value: 'password123' } });
    fireEvent.change(screen.getByLabelText(/confirm password/i), { target: { value: 'different' } });
    fireEvent.click(screen.getByRole('button', { name: /register/i }));
    expect(await screen.findByText(/passwords do not match/i)).toBeInTheDocument();
  });

  test('shows error for network/server error', async () => {
    // Mock useAuth to simulate network error
    jest.spyOn(require('../../context/AuthContext'), 'useAuth').mockReturnValue({
      register: async () => { throw { response: { data: { message: 'Server error' } } }; }
    });
    render(
      <MemoryRouter>
        <RegisterScreen disableRequired={true} />
      </MemoryRouter>
    );
    fireEvent.change(screen.getByLabelText(/first name/i), { target: { value: 'John' } });
    fireEvent.change(screen.getByLabelText(/last name/i), { target: { value: 'Doe' } });
    fireEvent.change(screen.getByLabelText(/phone number/i), { target: { value: '+256771234567' } });
    fireEvent.change(screen.getByLabelText(/^password$/i), { target: { value: 'password123' } });
    fireEvent.change(screen.getByLabelText(/confirm password/i), { target: { value: 'password123' } });
    fireEvent.click(screen.getByRole('button', { name: /register/i }));
    expect(await screen.findByText(/network error/i)).toBeInTheDocument();
    jest.restoreAllMocks();
  });
});

