import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { useWallet } from '../context/WalletContext';
import { SIMPLE_SWAP_ABI, ERC20_ABI } from '../config/web3';

export const useSimpleSwap = () => {
  const { isConnected, address, signer, contracts } = useWallet();
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Estados para los datos de los tokens
  const [tokenAAddress, setTokenAAddress] = useState(null);
  const [tokenBAddress, setTokenBAddress] = useState(null);
  const [tokenASymbol, setTokenASymbol] = useState('TKNA');
  const [tokenBSymbol, setTokenBSymbol] = useState('TKNB');
  const [tokenABalance, setTokenABalance] = useState('0');
  const [tokenBBalance, setTokenBBalance] = useState('0');
  const [tokenAAllowance, setTokenAAllowance] = useState('0');
  const [tokenBAllowance, setTokenBAllowance] = useState('0');
  const [reserves, setReserves] = useState(null);

  // Función para crear instancias de contratos
  const getContracts = () => {
    if (!signer || !contracts) return null;
    
    // Verificar que las direcciones no estén vacías
    if (!contracts.SimpleSwap || !contracts.TokenA || !contracts.TokenB) {
      console.error('Direcciones de contratos no configuradas para esta red');
      return null;
    }
    
    return {
      simpleSwap: new ethers.Contract(contracts.SimpleSwap, SIMPLE_SWAP_ABI, signer),
      tokenA: new ethers.Contract(contracts.TokenA, ERC20_ABI, signer),
      tokenB: new ethers.Contract(contracts.TokenB, ERC20_ABI, signer)
    };
  };

  // Cargar datos iniciales cuando se conecta
  useEffect(() => {
    const loadData = async () => {
      if (!isConnected || !signer || !contracts) return;

      try {
        const contractInstances = getContracts();
        if (!contractInstances) return;

        const { simpleSwap, tokenA, tokenB } = contractInstances;

        // Cargar direcciones de tokens
        const [tokenAAddr, tokenBAddr] = await Promise.all([
          simpleSwap.tokenA(),
          simpleSwap.tokenB()
        ]);
        
        setTokenAAddress(tokenAAddr);
        setTokenBAddress(tokenBAddr);

        // Cargar símbolos
        const [symbolA, symbolB] = await Promise.all([
          tokenA.symbol(),
          tokenB.symbol()
        ]);
        
        setTokenASymbol(symbolA);
        setTokenBSymbol(symbolB);

        // Cargar balances iniciales
        await loadBalances();
        await loadReserves();
        await loadAllowances();

      } catch (err) {
        console.error('Error cargando datos:', err);
        setError(err.message);
      }
    };

    loadData();
  }, [isConnected, signer, contracts, address]);

  // Cargar balances de tokens
  const loadBalances = async () => {
    if (!isConnected || !address || !contracts) return;

    try {
      const contractInstances = getContracts();
      if (!contractInstances) return;

      const { tokenA, tokenB } = contractInstances;

      const [balanceA, balanceB] = await Promise.all([
        tokenA.balanceOf(address),
        tokenB.balanceOf(address)
      ]);

      setTokenABalance(ethers.formatEther(balanceA));
      setTokenBBalance(ethers.formatEther(balanceB));
    } catch (err) {
      console.error('Error cargando balances:', err);
    }
  };

  // Cargar reservas del pool
  const loadReserves = async () => {
    if (!contracts) return;

    try {
      const contractInstances = getContracts();
      if (!contractInstances) return;

      const { simpleSwap } = contractInstances;
      const reservesData = await simpleSwap.getReserves();
      
      setReserves({
        reserveA: ethers.formatEther(reservesData[0]),
        reserveB: ethers.formatEther(reservesData[1])
      });
    } catch (err) {
      console.error('Error cargando reservas:', err);
    }
  };

  // Cargar allowances
  const loadAllowances = async () => {
    if (!isConnected || !address || !contracts) return;

    try {
      const contractInstances = getContracts();
      if (!contractInstances) return;

      const { tokenA, tokenB } = contractInstances;

      const [allowanceA, allowanceB] = await Promise.all([
        tokenA.allowance(address, contracts.SimpleSwap),
        tokenB.allowance(address, contracts.SimpleSwap)
      ]);

      setTokenAAllowance(allowanceA.toString());
      setTokenBAllowance(allowanceB.toString());
    } catch (err) {
      console.error('Error cargando allowances:', err);
    }
  };

  // Obtener cantidad de salida para el swap
  const getAmountOut = async (tokenIn, tokenOut, amountIn) => {
    try {
      if (!amountIn || amountIn === '0' || !contracts) return '0';
      
      const contractInstances = getContracts();
      if (!contractInstances) return '0';

      const { simpleSwap } = contractInstances;
      const amountOut = await simpleSwap.getAmountOut(
        tokenIn, 
        tokenOut, 
        ethers.parseEther(amountIn)
      );

      return ethers.formatEther(amountOut);
    } catch (error) {
      console.error('Error obteniendo cantidad de salida:', error);
      return '0';
    }
  };

  // Obtener precio
  const getPrice = async (tokenA, tokenB) => {
    try {
      if (!contracts) return '0';
      
      const contractInstances = getContracts();
      if (!contractInstances) return '0';

      const { simpleSwap } = contractInstances;
      const price = await simpleSwap.getPrice(tokenA, tokenB);

      return ethers.formatEther(price);
    } catch (error) {
      console.error('Error obteniendo precio:', error);
      return '0';
    }
  };

  // Aprobar gasto de tokens
  const approveToken = async (tokenAddress, amount) => {
    try {
      setIsLoading(true);
      setError(null);

      const contractInstances = getContracts();
      if (!contractInstances) throw new Error('Contratos no disponibles');

      const isTokenA = tokenAddress === contracts.TokenA;
      const tokenContract = isTokenA ? contractInstances.tokenA : contractInstances.tokenB;

      const tx = await tokenContract.approve(
        contracts.SimpleSwap, 
        ethers.parseEther(amount)
      );
      
      await tx.wait();
      
      // Recargar allowances después de la aprobación
      await loadAllowances();
      
      return true;
    } catch (error) {
      setError(error.message);
      console.error('Error aprobando token:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // Intercambiar tokens
  const swapTokens = async (amountIn, amountOutMin, path) => {
    try {
      setIsLoading(true);
      setError(null);

      const contractInstances = getContracts();
      if (!contractInstances) throw new Error('Contratos no disponibles');

      const { simpleSwap } = contractInstances;
      const deadline = Math.floor(Date.now() / 1000) + 3600; // 1 hora

      const tx = await simpleSwap.swapExactTokensForTokens(
        ethers.parseEther(amountIn),
        ethers.parseEther(amountOutMin),
        path,
        address,
        deadline
      );

      await tx.wait();
      
      // Recargar datos después del swap
      await loadBalances();
      await loadReserves();
      
      return true;
    } catch (error) {
      setError(error.message);
      console.error('Error intercambiando tokens:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // Agregar liquidez
  const addLiquidity = async (amountA, amountB, amountAMin, amountBMin) => {
    try {
      setIsLoading(true);
      setError(null);

      const contractInstances = getContracts();
      if (!contractInstances) throw new Error('Contratos no disponibles');

      const { simpleSwap } = contractInstances;
      const deadline = Math.floor(Date.now() / 1000) + 3600; // 1 hora

      const tx = await simpleSwap.addLiquidity(
        contracts.TokenA,
        contracts.TokenB,
        ethers.parseEther(amountA),
        ethers.parseEther(amountB),
        ethers.parseEther(amountAMin),
        ethers.parseEther(amountBMin),
        address,
        deadline
      );

      await tx.wait();
      
      // Recargar datos después de agregar liquidez
      await loadBalances();
      await loadReserves();
      
      return true;
    } catch (error) {
      setError(error.message);
      console.error('Error agregando liquidez:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // Remover liquidez
  const removeLiquidity = async (liquidity, amountAMin, amountBMin) => {
    try {
      setIsLoading(true);
      setError(null);

      const contractInstances = getContracts();
      if (!contractInstances) throw new Error('Contratos no disponibles');

      const { simpleSwap } = contractInstances;
      const deadline = Math.floor(Date.now() / 1000) + 3600; // 1 hora

      const tx = await simpleSwap.removeLiquidity(
        contracts.TokenA,
        contracts.TokenB,
        ethers.parseEther(liquidity),
        ethers.parseEther(amountAMin),
        ethers.parseEther(amountBMin),
        address,
        deadline
      );

      await tx.wait();
      
      // Recargar datos después de remover liquidez
      await loadBalances();
      await loadReserves();
      
      return true;
    } catch (error) {
      setError(error.message);
      console.error('Error removiendo liquidez:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // Mintear tokens de prueba
  const mintTokens = async (tokenAddress, amount) => {
    try {
      setIsLoading(true);
      setError(null);

      const contractInstances = getContracts();
      if (!contractInstances) throw new Error('Contratos no disponibles');

      const isTokenA = tokenAddress === contracts.TokenA;
      const tokenContract = isTokenA ? contractInstances.tokenA : contractInstances.tokenB;

      const tx = await tokenContract.mint(address, ethers.parseEther(amount));
      await tx.wait();
      
      // Recargar balances después del mint
      await loadBalances();
      
      return true;
    } catch (error) {
      setError(error.message);
      console.error('Error minteando tokens:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // Verificar si necesita aprobación
  const needsApproval = (tokenAddress, amount) => {
    if (!amount || amount === '0') return false;
    
    const allowance = tokenAddress === contracts?.TokenA ? tokenAAllowance : tokenBAllowance;
    console.log('needsApproval debug:', {
      tokenAddress,
      amount,
      allowance,
      contractTokenA: contracts?.TokenA,
      parsedAmount: ethers.parseEther(amount).toString()
    });
    
    if (!allowance || allowance === '0') return true;
    
    return ethers.parseEther(amount) > ethers.getBigInt(allowance);
  };

  // Función utilitaria para formatear balance
  const formatBalance = (balance) => {
    return balance || '0';
  };

  return {
    // Direcciones de contratos
    contracts,
    
    // Estado de conexión
    isConnected,
    address,
    
    // Estados de carga
    isLoading,
    error,
    
    // Datos de tokens
    tokenAAddress,
    tokenBAddress,
    tokenASymbol,
    tokenBSymbol,
    tokenABalance,
    tokenBBalance,
    tokenAAllowance,
    tokenBAllowance,
    
    // Datos del pool
    reserves,
    
    // Funciones
    getAmountOut,
    getPrice,
    approveToken,
    swapTokens,
    addLiquidity,
    removeLiquidity,
    mintTokens,
    needsApproval,
    loadBalances,
    loadReserves,
    
    // Utilidades
    formatBalance
  };
}; 