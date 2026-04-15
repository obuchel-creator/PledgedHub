import { render, screen } from '@testing-library/react';
import Toast from '../components/Toast';

describe('Toast', () => {
  it('renders success message', () => {
    render(<Toast message="Success!" type="success" duration={1000} />);
    expect(screen.getByText('Success!')).toBeInTheDocument();
  });
  it('renders error message', () => {
    render(<Toast message="Error!" type="error" duration={1000} />);
    expect(screen.getByText('Error!')).toBeInTheDocument();
  });
});
