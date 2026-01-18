import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import App from '../../App';

describe('App error boundary integration', () => {
  test('shows error boundary UI on runtime error', () => {
    // Mock a component to throw
    jest.spyOn(console, 'error').mockImplementation(() => {}); // suppress error log
    const Problem = () => { throw new Error('App crash!'); };
    render(
      <MemoryRouter>
        <App>
          <Problem />
        </App>
      </MemoryRouter>
    );
    expect(screen.getByText(/something went wrong/i)).toBeInTheDocument();
    expect(screen.getByText(/app crash/i)).toBeInTheDocument();
    console.error.mockRestore();
  });
});
