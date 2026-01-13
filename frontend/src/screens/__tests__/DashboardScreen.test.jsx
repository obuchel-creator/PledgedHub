import { render, screen, act } from '@testing-library/react';
import Dashboard from '../../screens/DashboardScreen';

test('renders dashboard loading state', () => {
  act(() => {
    render(<Dashboard />);
  });
  expect(screen.getByText(/Loading pledges and recent payments/i)).toBeInTheDocument();
});


