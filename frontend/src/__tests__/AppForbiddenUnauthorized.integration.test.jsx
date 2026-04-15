import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import App from '../../App';

describe('App forbidden/unauthorized routes', () => {
  test('shows ForbiddenScreen for forbidden route', () => {
    // Simulate forbidden by rendering the screen directly
    render(
      <MemoryRouter initialEntries={['/forbidden']}>
        <App />
      </MemoryRouter>
    );
    // This assumes /forbidden route renders ForbiddenScreen
    expect(screen.getByText(/forbidden/i)).toBeInTheDocument();
  });
  test('shows UnauthorizedScreen for unauthorized route', () => {
    render(
      <MemoryRouter initialEntries={['/unauthorized']}>
        <App />
      </MemoryRouter>
    );
    // This assumes /unauthorized route renders UnauthorizedScreen
    expect(screen.getByText(/unauthorized/i)).toBeInTheDocument();
  });
});
