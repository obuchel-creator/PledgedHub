import { render, screen, fireEvent } from '@testing-library/react';
import CreateCampaignScreen from '../screens/CreateCampaignScreen';
import { BrowserRouter } from 'react-router-dom';

describe('CreateCampaignScreen', () => {
  it('renders form and validates required fields', () => {
    render(
      <BrowserRouter>
        <CreateCampaignScreen />
      </BrowserRouter>
    );
    expect(screen.getByText(/Create a fundraising campaign/i)).toBeInTheDocument();
    fireEvent.click(screen.getByText(/Create campaign/i));
    expect(screen.getByText(/Campaign title is required/i)).toBeInTheDocument();
  });
});
