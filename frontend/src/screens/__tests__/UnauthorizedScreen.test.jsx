import { render, screen } from '@testing-library/react';
import UnauthorizedScreen from '../UnauthorizedScreen';
import { MemoryRouter } from 'react-router-dom';

describe('UnauthorizedScreen', () => {
  test('renders unauthorized message', () => {
    render(
      <MemoryRouter>
        <UnauthorizedScreen />
      </MemoryRouter>
    );
    expect(screen.getByText(/unauthorized/i)).toBeInTheDocument();
    expect(screen.getByText(/please log in/i)).toBeInTheDocument();
  });
});
