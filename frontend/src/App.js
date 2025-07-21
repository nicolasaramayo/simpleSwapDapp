import React from 'react';
import { WalletProvider } from './context/WalletContext';
import SwapInterface from './components/SwapInterface';
import Header from './components/Header';
import PoolInfo from './components/PoolInfo';
import './App.css';

function App() {
  return (
    <WalletProvider>
      <div className="App">
        <Header />
        <main className="main-content">
          <div className="container">
            <div className="dapp-layout">
              <div className="swap-section">
                <SwapInterface />
              </div>
              <div className="pool-info-section">
                <PoolInfo />
              </div>
            </div>
          </div>
        </main>
      </div>
    </WalletProvider>
  );
}

export default App;
