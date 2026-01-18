import { render, screen } from '@testing-library/react';
import GlobalErrorBoundary from '../GlobalErrorBoundary';
import React from 'react';

describe('GlobalErrorBoundary', () => {
  test('renders fallback UI on error and allows reporting', () => {
    // Component that throws
    function ProblemChild() {
      throw new Error('Test error for boundary');
    }
    render(
      <GlobalErrorBoundary>
        <ProblemChild />
      </GlobalErrorBoundary>
    );
    expect(screen.getByText(/something went wrong/i)).toBeInTheDocument();
    expect(screen.getByText(/test error for boundary/i)).toBeInTheDocument();
    const reportBtn = screen.getByRole('button', { name: /report this issue/i });
    expect(reportBtn).toBeInTheDocument();
  });
});
