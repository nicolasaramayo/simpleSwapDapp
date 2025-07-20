import React, { createContext, useContext, useState, useEffect } from 'react';
import { connectWallet, getNetworkConfig } from '../config/web3';

const WalletContext = createContext();

export const useWallet = () => {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error('useWallet debe ser usado dentro de WalletProvider');
  }
  return context;
};

export const WalletProvider = ({ children }) => {
  const [isConnected, setIsConnected] = useState(false);
  const [address, setAddress] = useState(null);
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [chainId, setChainId] = useState(null);
  const [contracts, setContracts] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Función para conectar wallet
  const connect = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const walletData = await connectWallet();
      
      setProvider(walletData.provider);
      setSigner(walletData.signer);
      setAddress(walletData.address);
      setChainId(walletData.chainId);
      setIsConnected(true);
      
      // Configurar contratos para la red actual
      const networkConfig = getNetworkConfig(walletData.chainId);
      setContracts(networkConfig.contracts);
      
    } catch (err) {
      setError(err.message);
      console.error('Error conectando wallet:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Función para desconectar wallet
  const disconnect = () => {
    setIsConnected(false);
    setAddress(null);
    setProvider(null);
    setSigner(null);
    setChainId(null);
    setContracts(null);
    setError(null);
  };

  // Verificar si ya hay una conexión al cargar
  useEffect(() => {
    const checkConnection = async () => {
      if (window.ethereum) {
        try {
          const accounts = await window.ethereum.request({ method: 'eth_accounts' });
          if (accounts.length > 0) {
            await connect();
          }
        } catch (err) {
          console.error('Error verificando conexión:', err);
        }
      }
    };

    checkConnection();
  }, []);

  // Escuchar cambios de cuenta y red
  useEffect(() => {
    if (window.ethereum) {
      const handleAccountsChanged = (accounts) => {
        if (accounts.length === 0) {
          disconnect();
        } else if (accounts[0] !== address) {
          connect();
        }
      };

      const handleChainChanged = () => {
        connect(); // Reconectar para actualizar la red
      };

      window.ethereum.on('accountsChanged', handleAccountsChanged);
      window.ethereum.on('chainChanged', handleChainChanged);

      return () => {
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
        window.ethereum.removeListener('chainChanged', handleChainChanged);
      };
    }
  }, [address]);

  const value = {
    // Estado
    isConnected,
    address,
    provider,
    signer,
    chainId,
    contracts,
    isLoading,
    error,
    
    // Funciones
    connect,
    disconnect
  };

  return (
    <WalletContext.Provider value={value}>
      {children}
    </WalletContext.Provider>
  );
}; 