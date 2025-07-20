import { render, screen } from '@testing-library/react';
import App from './App';

test('renders SimpleSwap DEX title', () => {
  render(<App />);
  const titleElement = screen.getByText(/SimpleSwap DEX/i);
  expect(titleElement).toBeInTheDocument();
});

test('renders connect wallet button', () => {
  render(<App />);
  const buttonElement = screen.getByText(/Conectar Wallet/i);
  expect(buttonElement).toBeInTheDocument();
});
