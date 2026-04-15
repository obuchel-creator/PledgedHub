import { render, screen, fireEvent } from '@testing-library/react';
import ProfileScreen from '../screens/ProfileScreen';
import { AuthContext } from '../context/AuthContext';

describe('ProfileScreen', () => {
  const mockUser = {
    name: 'Test User',
    email: 'test@example.com',
    username: 'testuser',
    phone_number: '256771234567',
    role: 'admin',
  };

  it('renders profile fields and allows editing', async () => {
    render(
      <AuthContext.Provider value={{ user: mockUser, refreshUser: jest.fn() }}>
        <ProfileScreen />
      </AuthContext.Provider>
    );
    expect(screen.getByText('My Profile')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Test User')).toBeInTheDocument();
    fireEvent.click(screen.getByText(/Edit Profile/i));
    const nameInput = screen.getByLabelText(/Full Name/i);
    fireEvent.change(nameInput, { target: { value: 'New Name' } });
    expect(nameInput.value).toBe('New Name');
  });
});
