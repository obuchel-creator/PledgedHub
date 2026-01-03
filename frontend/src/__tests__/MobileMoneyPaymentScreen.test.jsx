import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import MobileMoneyPaymentScreen from '../screens/MobileMoneyPaymentScreen';
import * as api from '../utils/api';

jest.mock('../utils/api');

const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
  useParams: () => ({ pledgeId: '1' })
}));

describe('MobileMoneyPaymentScreen', () => {
  it('shows error if phone or amount missing', async () => {
    render(<MobileMoneyPaymentScreen />);
    fireEvent.click(screen.getByText(/Pay Now/i));
    expect(await screen.findByText(/Phone and amount are required/i)).toBeInTheDocument();
  });

  it('shows success on payment', async () => {
    api.postWithAuth.mockResolvedValue({ success: true });
    render(<MobileMoneyPaymentScreen />);
    fireEvent.change(screen.getByPlaceholderText(/2567XXXXXXXX/i), { target: { value: '256700000000' } });
    fireEvent.change(screen.getByLabelText(/Amount/i), { target: { value: '10000' } });
    fireEvent.click(screen.getByText(/Pay Now/i));
    await waitFor(() => expect(screen.getByText(/Payment initiated/i)).toBeInTheDocument());
  });
});
