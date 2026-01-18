import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import App from '../../App';

describe('App 404 route', () => {
  test('shows NotFoundScreen for unknown route', () => {
    render(
      <MemoryRouter initialEntries={['/some/unknown/route']}>
        <App />
      </MemoryRouter>
    );
    expect(screen.getByText(/404/i)).toBeInTheDocument();
    expect(screen.getByText(/not found/i)).toBeInTheDocument();
  });
});
