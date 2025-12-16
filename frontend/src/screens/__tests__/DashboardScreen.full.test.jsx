import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Dashboard from '../../screens/DashboardScreen';
import { MemoryRouter } from 'react-router-dom';

describe('DashboardScreen', () => {
  test('renders loading state', () => {
    render(
      <MemoryRouter>
        <Dashboard />
      </MemoryRouter>,
    );
    expect(screen.getByText(/Loading pledges and recent payments/i)).toBeInTheDocument();
  });

  test('renders pledge form fields', async () => {
    render(
      <MemoryRouter>
        <Dashboard />
      </MemoryRouter>,
    );
    expect(await screen.findByLabelText(/Pledger name/i)).toBeInTheDocument();
    expect(await screen.findByLabelText(/Phone Number/i)).toBeInTheDocument();
    expect(await screen.findByLabelText(/Amount pledged/i)).toBeInTheDocument();
    expect(await screen.findByLabelText(/What are you pledging for/i)).toBeInTheDocument();
  });

  test('can type in pledge form', async () => {
    render(
      <MemoryRouter>
        <Dashboard />
      </MemoryRouter>,
    );
    const nameInput = await screen.findByLabelText(/Pledger name/i);
    await userEvent.type(nameInput, 'Test User');
    expect(nameInput).toHaveValue('Test User');
  });
});
