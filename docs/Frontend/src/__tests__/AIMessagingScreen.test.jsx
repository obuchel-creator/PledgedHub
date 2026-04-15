import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import AIMessagingScreen from '../screens/AIMessagingScreen';
import * as api from '../utils/api';

jest.mock('../utils/api');

describe('AIMessagingScreen', () => {
  it('generates AI message on submit', async () => {
    api.postWithAuth.mockResolvedValue({ success: true, data: { message: 'AI message' } });
    render(<AIMessagingScreen />);
    fireEvent.change(screen.getByLabelText(/Pledge ID/i), { target: { value: '1' } });
    fireEvent.click(screen.getByText(/Generate Message/i));
    await waitFor(() => expect(screen.getByText(/AI message/i)).toBeInTheDocument());
  });

  it('shows error on API failure', async () => {
    api.postWithAuth.mockResolvedValue({ success: false, error: 'AI error' });
    render(<AIMessagingScreen />);
    fireEvent.change(screen.getByLabelText(/Pledge ID/i), { target: { value: '1' } });
    fireEvent.click(screen.getByText(/Generate Message/i));
    await waitFor(() => expect(screen.getByText(/AI error/i)).toBeInTheDocument());
  });
});
