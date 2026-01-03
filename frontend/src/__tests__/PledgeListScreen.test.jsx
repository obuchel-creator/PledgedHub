import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import PledgeListScreen from '../screens/PledgeListScreen';
import * as api from '../utils/api';

jest.mock('../utils/api');

describe('PledgeListScreen', () => {
  it('renders loading and then pledges', async () => {
    api.fetchWithAuth.mockResolvedValue({ success: true, data: { pledges: [{ id: 1, title: 'Test Pledge', amount: 10000 }] } });
    render(
      <MemoryRouter>
        <PledgeListScreen />
      </MemoryRouter>
    );
    expect(screen.getByText(/Loading pledges/i)).toBeInTheDocument();
    await waitFor(() => expect(screen.getByText(/Test Pledge/i)).toBeInTheDocument());
  });

  it('shows error on API failure', async () => {
    api.fetchWithAuth.mockResolvedValue({ success: false, error: 'API error' });
    render(
      <MemoryRouter>
        <PledgeListScreen />
      </MemoryRouter>
    );
    await waitFor(() => expect(screen.getByText(/API error/i)).toBeInTheDocument());
  });
});
