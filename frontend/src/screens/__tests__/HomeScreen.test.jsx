import { render, screen } from '@testing-library/react';
import HomeScreen from '../HomeScreen';
import { MemoryRouter } from 'react-router-dom';

describe('HomeScreen', () => {
  test('renders hero section and campaign stats', () => {
    render(
      <MemoryRouter>
        <HomeScreen />
      </MemoryRouter>
    );
    expect(screen.getByText(/quick snapshot/i)).toBeInTheDocument();
    // There are multiple elements with 'active campaigns' text, so use getAllByText
    const activeCampaigns = screen.getAllByText(/active campaigns/i);
    expect(activeCampaigns.length).toBeGreaterThan(0);
    expect(screen.getByText(/combined goal/i)).toBeInTheDocument();
    expect(screen.getByText(/avg. suggested gift/i)).toBeInTheDocument();
  });
});


