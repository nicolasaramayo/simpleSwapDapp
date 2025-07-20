import React from 'react';
import { useWallet } from '../context/WalletContext';
import './Header.css';

const Header = () => {
  const { address, isConnected, chainId, connect, disconnect, isLoading, error } = useWallet();

  const formatAddress = (address) => {
    if (!address) return '';
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const getNetworkName = (chainId) => {
    switch (chainId) {
      case 31337:
        return 'Localhost';
      case 11155111:
        return 'Sepolia';
      default:
        return 'Unknown';
    }
  };

  return (
    <header className="header">
      <div className="container">
        <div className="header-content">
          <div className="logo-section">
            <h1 className="logo">SimpleSwap DEX</h1>
            <span className="version">v1.0</span>
          </div>
          
          <nav className="navigation">
            <a href="#swap" className="nav-link active">Swap</a>
            <a href="#pool" className="nav-link">Pool</a>
            <a href="#docs" className="nav-link">Docs</a>
          </nav>

          <div className="wallet-section">
            {isConnected ? (
              <div className="wallet-info">
                <div className="network-info">
                  <span className="network-dot"></span>
                  {getNetworkName(chainId)}
                </div>
                <div className="account-info">
                  <span className="address">{formatAddress(address)}</span>
                  <button 
                    onClick={disconnect}
                    className="disconnect-button"
                    title="Disconnect wallet"
                  >
                    ×
                  </button>
                </div>
              </div>
            ) : (
              <div className="connect-section">
                <button 
                  onClick={connect}
                  disabled={isLoading}
                  className="connect-button"
                >
                  {isLoading ? 'Conectando...' : 'Conectar Wallet'}
                </button>
                {error && (
                  <div className="error-message">
                    {error}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header; 