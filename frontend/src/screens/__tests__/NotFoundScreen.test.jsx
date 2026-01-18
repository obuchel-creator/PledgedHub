import { render, screen } from '@testing-library/react';
import NotFoundScreen from '../NotFoundScreen';
import { MemoryRouter } from 'react-router-dom';

describe('NotFoundScreen', () => {
  test('renders 404 not found message', () => {
    render(
      <MemoryRouter>
        <NotFoundScreen />
      </MemoryRouter>
    );
    expect(screen.getByText(/404/i)).toBeInTheDocument();
    expect(screen.getByText(/not found/i)).toBeInTheDocument();
  });
});
