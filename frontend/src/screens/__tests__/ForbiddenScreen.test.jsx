import { render, screen } from '@testing-library/react';
import ForbiddenScreen from '../ForbiddenScreen';
import { MemoryRouter } from 'react-router-dom';

describe('ForbiddenScreen', () => {
  test('renders forbidden message', () => {
    render(
      <MemoryRouter>
        <ForbiddenScreen />
      </MemoryRouter>
    );
    expect(screen.getByText(/forbidden/i)).toBeInTheDocument();
    expect(screen.getByText(/access denied/i)).toBeInTheDocument();
  });
});
