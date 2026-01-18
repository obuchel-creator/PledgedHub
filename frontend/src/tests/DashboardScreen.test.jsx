import { render, screen } from '@testing-library/react';
import DashboardScreen from '../screens/DashboardScreen';
import { AuthContext } from '../context/AuthContext';

jest.mock('../hooks/useDashboardData', () => () => ({
  loading: false,
  pledges: [],
  payments: [],
  paymentsError: '',
  pledgeForm: {},
  pledgeMessage: { text: '', type: '' },
  creatingPledge: false,
  handlePledgeFieldChange: jest.fn(),
  handlePledgeSubmit: jest.fn(),
  resetPledgeForm: jest.fn(),
}));

describe('DashboardScreen', () => {
  it('renders dashboard header', () => {
    render(
      <AuthContext.Provider value={{ user: { name: 'Test User' } }}>
        <DashboardScreen />
      </AuthContext.Provider>
    );
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
  });
});
