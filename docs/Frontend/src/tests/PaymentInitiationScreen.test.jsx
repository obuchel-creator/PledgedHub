import { render, screen, fireEvent } from '@testing-library/react';
import PaymentInitiationScreen from '../screens/PaymentInitiationScreen';
import { AuthContext } from '../context/AuthContext';

describe('PaymentInitiationScreen', () => {
  const mockContext = { token: 'test-token' };

  it('renders and validates phone number', () => {
    render(
      <AuthContext.Provider value={mockContext}>
        <PaymentInitiationScreen pledgeId={1} pledgeAmount={10000} />
      </AuthContext.Provider>
    );
    expect(screen.getByText(/Complete Payment/i)).toBeInTheDocument();
    fireEvent.click(screen.getByText(/MTN Mobile Money/i));
    fireEvent.change(screen.getByLabelText(/Phone Number/i), { target: { value: '123' } });
    fireEvent.click(screen.getByText(/Next/i));
    expect(screen.getByText(/valid Uganda phone number/i)).toBeInTheDocument();
  });
});
