import React, { useState, useEffect } from 'react';
import { useSimpleSwap } from '../hooks/useSimpleSwap';
import './PoolInfo.css';

const PoolInfo = () => {
  const {
    isConnected,
    contracts,
    tokenASymbol,
    tokenBSymbol,
    reserves,
    getPrice
  } = useSimpleSwap();

  const [priceAtoB, setPriceAtoB] = useState('0');
  const [priceBtoA, setPriceBtoA] = useState('0');

  useEffect(() => {
    const fetchPrices = async () => {
      if (!contracts?.TokenA || !contracts?.TokenB || !reserves) return;

      try {
        const priceAB = await getPrice(contracts.TokenA, contracts.TokenB);
        const priceBA = await getPrice(contracts.TokenB, contracts.TokenA);
        
        setPriceAtoB(priceAB);
        setPriceBtoA(priceBA);
      } catch (error) {
        console.error('Error fetching prices:', error);
      }
    };

    fetchPrices();
    
    // Update prices every 30 seconds
    const interval = setInterval(fetchPrices, 30000);
    return () => clearInterval(interval);
  }, [contracts, reserves, getPrice]);

  const formatNumber = (num) => {
    if (!num || num === '0') return '0';
    const number = parseFloat(num);
    if (number < 0.000001) return '< 0.000001';
    if (number < 1) return number.toFixed(6);
    if (number < 1000) return number.toFixed(4);
    if (number < 1000000) return (number / 1000).toFixed(2) + 'K';
    return (number / 1000000).toFixed(2) + 'M';
  };

  const calculateTVL = () => {
    if (!reserves || !priceAtoB) return '0';
    
    const reserveA = parseFloat(reserves.reserveA || 0);
    const reserveB = parseFloat(reserves.reserveB || 0);
    const price = parseFloat(priceAtoB || 0);
    
    // Simple TVL calculation: reserveA + (reserveB / price)
    // In a real scenario, you'd use USD prices from an oracle
    const tvl = reserveA + (reserveB / (price || 1));
    return tvl;
  };

  const calculateVolume = () => {
    // This would normally come from tracking swap events
    // For demo purposes, we'll show a placeholder
    return Math.random() * 10000;
  };

  if (!isConnected) {
    return (
      <div className="pool-info">
        <div className="info-card">
          <h3>Pool Information</h3>
          <p className="connect-message">Conecta tu wallet para ver la información del pool</p>
        </div>
      </div>
    );
  }

  return (
    <div className="pool-info">
      <div className="info-card">
        <div className="card-header">
          <h3>Pool Information</h3>
          <div className="refresh-indicator">
            <span className="refresh-dot"></span>
            Live
          </div>
        </div>

        <div className="stats-grid">
          {/* TVL */}
          <div className="stat-item">
            <div className="stat-label">Total Value Locked</div>
            <div className="stat-value">
              {formatNumber(calculateTVL())} {tokenASymbol}
            </div>
            <div className="stat-change positive">+2.34%</div>
          </div>

          {/* Volume */}
          <div className="stat-item">
            <div className="stat-label">24h Volume</div>
            <div className="stat-value">
              {formatNumber(calculateVolume())} {tokenASymbol}
            </div>
            <div className="stat-change negative">-1.23%</div>
          </div>

          {/* Reserves */}
          <div className="stat-item">
            <div className="stat-label">Pool Reserves</div>
            <div className="reserve-amounts">
              <div className="reserve-item">
                <span className="amount">{formatNumber(reserves?.reserveA)}</span>
                <span className="symbol">{tokenASymbol}</span>
              </div>
              <div className="reserve-divider">•</div>
              <div className="reserve-item">
                <span className="amount">{formatNumber(reserves?.reserveB)}</span>
                <span className="symbol">{tokenBSymbol}</span>
              </div>
            </div>
          </div>

          {/* Prices */}
          <div className="stat-item">
            <div className="stat-label">Current Prices</div>
            <div className="price-info">
              <div className="price-item">
                <span className="price-pair">
                  {tokenASymbol}/{tokenBSymbol}
                </span>
                <span className="price-value">
                  {formatNumber(priceAtoB)}
                </span>
              </div>
              <div className="price-item">
                <span className="price-pair">
                  {tokenBSymbol}/{tokenASymbol}
                </span>
                <span className="price-value">
                  {formatNumber(priceBtoA)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Pool Composition Chart */}
        <div className="pool-composition">
          <div className="composition-header">
            <h4>Pool Composition</h4>
          </div>
          <div className="composition-chart">
            <div className="chart-bar">
              <div 
                className="chart-segment token-a"
                style={{
                  width: reserves ? `${(parseFloat(reserves.reserveA) / (parseFloat(reserves.reserveA) + parseFloat(reserves.reserveB))) * 100}%` : '50%'
                }}
              ></div>
              <div 
                className="chart-segment token-b"
                style={{
                  width: reserves ? `${(parseFloat(reserves.reserveB) / (parseFloat(reserves.reserveA) + parseFloat(reserves.reserveB))) * 100}%` : '50%'
                }}
              ></div>
            </div>
            <div className="chart-legend">
              <div className="legend-item">
                <div className="legend-color token-a"></div>
                <span>{tokenASymbol}</span>
                <span className="percentage">
                  {reserves ? `${((parseFloat(reserves.reserveA) / (parseFloat(reserves.reserveA) + parseFloat(reserves.reserveB))) * 100).toFixed(1)}%` : '50%'}
                </span>
              </div>
              <div className="legend-item">
                <div className="legend-color token-b"></div>
                <span>{tokenBSymbol}</span>
                <span className="percentage">
                  {reserves ? `${((parseFloat(reserves.reserveB) / (parseFloat(reserves.reserveA) + parseFloat(reserves.reserveB))) * 100).toFixed(1)}%` : '50%'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="quick-actions">
          <h4>Quick Actions</h4>
          <div className="action-buttons">
            <button className="action-btn primary">Add Liquidity</button>
            <button className="action-btn secondary">Remove Liquidity</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PoolInfo; 