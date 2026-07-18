import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

import App from './app';

describe('App', () => {
  it('renders the Smart Citizen workspace shell', () => {
    render(
      <MemoryRouter future={{ v7_relativeSplatPath: true, v7_startTransition: true }}>
        <App />
      </MemoryRouter>,
    );

    expect(screen.getByRole('heading', { level: 1, name: 'Smart Citizen' })).toBeVisible();
    expect(screen.getByRole('heading', { level: 2, name: 'Workspace overview' })).toBeVisible();
    expect(screen.getByText('No community data has been configured.')).toBeVisible();
  });
});
