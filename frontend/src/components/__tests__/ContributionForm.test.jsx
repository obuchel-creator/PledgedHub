import React from 'react';
import { render, screen } from '@testing-library/react';
import ContributionForm from '../components/ContributionForm';

describe('ContributionForm', () => {
  test('renders contribute now button', () => {
    render(
      <ContributionForm campaign={{ title: 'Test Campaign', goal_amount: 1000000 }} onSuccess={() => {}} />
    );
    expect(screen.getByRole('button', { name: /contribute now/i })).toBeInTheDocument();
  });
});
