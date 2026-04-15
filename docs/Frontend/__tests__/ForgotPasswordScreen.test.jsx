import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import ForgotPasswordScreen from '../src/screens/ForgotPasswordScreen';

jest.mock('../src/services/api', () => ({
  forgotPassword: jest.fn((email, phone, code, newPassword) => {
    if (email === 'success@example.com') return Promise.resolve({ success: true });
    if (phone === '256700000000' && !code) return Promise.resolve({ success: true });
    if (phone === '256700000000' && code === '123456' && newPassword === 'newpass123') return Promise.resolve({ success: true });
    return Promise.resolve({ success: false, error: 'Test error' });
  })
}));

describe('ForgotPasswordScreen', () => {
  it('renders email reset form and handles success', async () => {
    render(<MemoryRouter><ForgotPasswordScreen /></MemoryRouter>);
    fireEvent.change(screen.getByLabelText(/Email Address/i), { target: { value: 'success@example.com' } });
    fireEvent.click(screen.getByRole('button', { name: /Send reset link/i }));
    await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent(/Reset link sent/i));
  });

  it('shows error for invalid email', async () => {
    render(<MemoryRouter><ForgotPasswordScreen /></MemoryRouter>);
    fireEvent.change(screen.getByLabelText(/Email Address/i), { target: { value: 'fail@example.com' } });
    fireEvent.click(screen.getByRole('button', { name: /Send reset link/i }));
    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent(/Test error/i));
  });

  it('switches to phone reset and handles code verification', async () => {
    render(<MemoryRouter><ForgotPasswordScreen /></MemoryRouter>);
    fireEvent.click(screen.getByRole('button', { name: /Switch to phone reset/i }));
    fireEvent.change(screen.getByLabelText(/Phone Number/i), { target: { value: '256700000000' } });
    fireEvent.click(screen.getByRole('button', { name: /Send reset code/i }));
    await waitFor(() => expect(screen.getByLabelText(/Reset Code/i)).toBeInTheDocument());
    fireEvent.change(screen.getByLabelText(/Reset Code/i), { target: { value: '123456' } });
    fireEvent.change(screen.getByLabelText(/New Password/i), { target: { value: 'newpass123' } });
    fireEvent.click(screen.getByRole('button', { name: /Reset password/i }));
    await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent(/Password reset successful/i));
  });

  it('shows error for invalid phone/code', async () => {
    render(<MemoryRouter><ForgotPasswordScreen /></MemoryRouter>);
    fireEvent.click(screen.getByRole('button', { name: /Switch to phone reset/i }));
    fireEvent.change(screen.getByLabelText(/Phone Number/i), { target: { value: '256799999999' } });
    fireEvent.click(screen.getByRole('button', { name: /Send reset code/i }));
    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent(/Test error/i));
  });
});
