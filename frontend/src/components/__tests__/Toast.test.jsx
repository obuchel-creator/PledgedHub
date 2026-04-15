import { render, screen } from '@testing-library/react';
import { ToastContainer, toast } from 'react-toastify';
import React from 'react';

describe('Toast feedback', () => {
  test('shows toast on error', () => {
    render(<ToastContainer />);
    toast.error('Test error message');
    expect(screen.getByText(/test error message/i)).toBeInTheDocument();
  });
});
