import React, { useState, useEffect } from 'react';
import { useSimpleSwap } from '../hooks/useSimpleSwap';
import './SwapInterface.css';

const SwapInterface = () => {
  const {
    isConnected,
    contracts,
    tokenASymbol,
    tokenBSymbol,
    tokenABalance,
    tokenBBalance,
    isLoading,
    error,
    swapTokens,
    approveToken,
    needsApproval,
    getAmountOut,
    mintTokens
  } = useSimpleSwap();

  const [fromToken, setFromToken] = useState('A');
  const [toToken, setToToken] = useState('B');
  const [fromAmount, setFromAmount] = useState('');
  const [toAmount, setToAmount] = useState('');
  const [slippage, setSlippage] = useState('0.5');
  const [isCalculating, setIsCalculating] = useState(false);

  // Calculate output amount when input changes
  useEffect(() => {
    const calculateOutput = async () => {
      if (!fromAmount || !parseFloat(fromAmount) || !contracts?.SimpleSwap) {
        setToAmount('');
        return;
      }

      setIsCalculating(true);
      try {
        const tokenIn = fromToken === 'A' ? contracts.TokenA : contracts.TokenB;
        const tokenOut = toToken === 'A' ? contracts.TokenA : contracts.TokenB;
        
        const outputAmount = await getAmountOut(tokenIn, tokenOut, fromAmount);
        setToAmount(outputAmount);
      } catch (error) {
        console.error('Error calculating output:', error);
        setToAmount('0');
      } finally {
        setIsCalculating(false);
      }
    };

    const timeoutId = setTimeout(calculateOutput, 500); // Debounce
    return () => clearTimeout(timeoutId);
  }, [fromAmount, fromToken, toToken, contracts, getAmountOut]);

  const handleSwapDirection = () => {
    setFromToken(toToken);
    setToToken(fromToken);
    setFromAmount(toAmount);
    setToAmount(fromAmount);
  };

  const handleMaxClick = () => {
    const balance = fromToken === 'A' ? tokenABalance : tokenBBalance;
    setFromAmount(balance);
  };

  const calculateMinimumOutput = () => {
    if (!toAmount || !parseFloat(toAmount)) return '0';
    const slippageMultiplier = (100 - parseFloat(slippage)) / 100;
    return (parseFloat(toAmount) * slippageMultiplier).toString();
  };

  const handleApprove = async () => {
    const tokenAddress = fromToken === 'A' ? contracts.TokenA : contracts.TokenB;
    await approveToken(tokenAddress, fromAmount);
  };

  const handleSwap = async () => {
    const tokenIn = fromToken === 'A' ? contracts.TokenA : contracts.TokenB;
    const tokenOut = toToken === 'A' ? contracts.TokenA : contracts.TokenB;
    const path = [tokenIn, tokenOut];
    const minimumOutput = calculateMinimumOutput();

    const success = await swapTokens(fromAmount, minimumOutput, path);
    if (success) {
      setFromAmount('');
      setToAmount('');
    }
  };

  const handleMintTokens = async (token) => {
    const tokenAddress = token === 'A' ? contracts.TokenA : contracts.TokenB;
    await mintTokens(tokenAddress, '1000');
  };

  const getTokenBalance = (token) => {
    return token === 'A' ? tokenABalance : tokenBBalance;
  };

  const getTokenSymbol = (token) => {
    return token === 'A' ? tokenASymbol : tokenBSymbol;
  };

  const needsTokenApproval = () => {
    const tokenAddress = fromToken === 'A' ? contracts.TokenA : contracts.TokenB;
    return needsApproval(tokenAddress, fromAmount);
  };

  const canSwap = () => {
    return (
      isConnected &&
      fromAmount &&
      parseFloat(fromAmount) > 0 &&
      toAmount &&
      parseFloat(toAmount) > 0 &&
      parseFloat(fromAmount) <= parseFloat(getTokenBalance(fromToken)) &&
      !needsTokenApproval()
    );
  };

  if (!isConnected) {
    return (
      <div className="swap-interface">
        <div className="swap-card">
          <h2>Connect Wallet</h2>
          <p>Por favor conecta tu wallet para usar SimpleSwap</p>
          <p>Usa el botón "Conectar Wallet" en la parte superior de la página.</p>
        </div>
      </div>
    );
  }

  // Verificar si los contratos están configurados
  if (!contracts?.SimpleSwap || !contracts?.TokenA || !contracts?.TokenB) {
    return (
      <div className="swap-interface">
        <div className="swap-card">
          <h2>⚠️ Contratos No Configurados</h2>
          <div className="error-message">
            <p>Las direcciones de contratos no están configuradas para esta red.</p>
            <p><strong>Opciones:</strong></p>
            <ul style={{textAlign: 'left', marginTop: '10px'}}>
              <li>Cambia a <strong>Localhost</strong> en MetaMask</li>
              <li>O despliega los contratos en Sepolia</li>
            </ul>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="swap-interface">
      <div className="swap-card">
        <div className="swap-header">
          <h2>Swap Tokens</h2>
          <div className="slippage-settings">
            <label>Slippage: </label>
            <select 
              value={slippage} 
              onChange={(e) => setSlippage(e.target.value)}
            >
              <option value="0.1">0.1%</option>
              <option value="0.5">0.5%</option>
              <option value="1.0">1.0%</option>
              <option value="3.0">3.0%</option>
            </select>
          </div>
        </div>

        {error && (
          <div className="error-message">
            {error}
          </div>
        )}

        <div className="swap-form">
          {/* From Token */}
          <div className="token-input">
            <div className="token-input-header">
              <span>From</span>
              <span className="balance">
                Balance: {getTokenBalance(fromToken)} {getTokenSymbol(fromToken)}
              </span>
            </div>
            <div className="token-input-body">
              <input
                type="number"
                value={fromAmount}
                onChange={(e) => setFromAmount(e.target.value)}
                placeholder="0.0"
                className="amount-input"
              />
              <div className="token-selector">
                <select 
                  value={fromToken} 
                  onChange={(e) => setFromToken(e.target.value)}
                >
                  <option value="A">{getTokenSymbol('A')}</option>
                  <option value="B">{getTokenSymbol('B')}</option>
                </select>
                <button 
                  onClick={handleMaxClick}
                  className="max-button"
                >
                  MAX
                </button>
              </div>
            </div>
          </div>

          {/* Swap Direction Button */}
          <div className="swap-direction">
            <button 
              onClick={handleSwapDirection}
              className="swap-direction-button"
              disabled={isLoading}
            >
              ⇅
            </button>
          </div>

          {/* To Token */}
          <div className="token-input">
            <div className="token-input-header">
              <span>To</span>
              <span className="balance">
                Balance: {getTokenBalance(toToken)} {getTokenSymbol(toToken)}
              </span>
            </div>
            <div className="token-input-body">
              <input
                type="number"
                value={isCalculating ? 'Calculating...' : toAmount}
                readOnly
                placeholder="0.0"
                className="amount-input"
              />
              <div className="token-selector">
                <select 
                  value={toToken} 
                  onChange={(e) => setToToken(e.target.value)}
                >
                  <option value="A">{getTokenSymbol('A')}</option>
                  <option value="B">{getTokenSymbol('B')}</option>
                </select>
              </div>
            </div>
          </div>

          {/* Swap Details */}
          {toAmount && parseFloat(toAmount) > 0 && (
            <div className="swap-details">
              <div className="detail-row">
                <span>Rate:</span>
                <span>
                  1 {getTokenSymbol(fromToken)} = {(parseFloat(toAmount) / parseFloat(fromAmount || 1)).toFixed(6)} {getTokenSymbol(toToken)}
                </span>
              </div>
              <div className="detail-row">
                <span>Minimum received:</span>
                <span>{calculateMinimumOutput()} {getTokenSymbol(toToken)}</span>
              </div>
              <div className="detail-row">
                <span>Slippage tolerance:</span>
                <span>{slippage}%</span>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="action-buttons">
            {needsTokenApproval() ? (
              <button
                onClick={handleApprove}
                disabled={isLoading || !fromAmount || parseFloat(fromAmount) <= 0}
                className="approve-button"
              >
                {isLoading ? 'Approving...' : `Approve ${getTokenSymbol(fromToken)}`}
              </button>
            ) : (
              <button
                onClick={handleSwap}
                disabled={!canSwap() || isLoading}
                className="swap-button"
              >
                {isLoading ? 'Swapping...' : 'Swap'}
              </button>
            )}
          </div>

          {/* Development Tools */}
          <div className="dev-tools">
            <h4>Development Tools</h4>
            <div className="mint-buttons">
              <button
                onClick={() => handleMintTokens('A')}
                disabled={isLoading}
                className="mint-button"
              >
                Mint 1000 {getTokenSymbol('A')}
              </button>
              <button
                onClick={() => handleMintTokens('B')}
                disabled={isLoading}
                className="mint-button"
              >
                Mint 1000 {getTokenSymbol('B')}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SwapInterface; 