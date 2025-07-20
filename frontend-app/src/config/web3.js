import { ethers } from 'ethers';

// Contract ABIs - Exactamente como los tenías
export const SIMPLE_SWAP_ABI = [
  "function initialize(address _tokenA, address _tokenB) external",
  "function addLiquidity(address _tokenA, address _tokenB, uint256 amountADesired, uint256 amountBDesired, uint256 amountAMin, uint256 amountBMin, address to, uint256 deadline) external returns (uint256 amountA, uint256 amountB, uint256 liquidity)",
  "function removeLiquidity(address _tokenA, address _tokenB, uint256 liquidity, uint256 amountAMin, uint256 amountBMin, address to, uint256 deadline) external returns (uint256 amountA, uint256 amountB)",
  "function swapExactTokensForTokens(uint256 amountIn, uint256 amountOutMin, address[] calldata path, address to, uint256 deadline) external",
  "function getAmountOut(address _tokenIn, address _tokenOut, uint256 amountIn) external view returns (uint256 amountOut)",
  "function getPrice(address _tokenA, address _tokenB) external view returns (uint256 price)",
  "function getReserves() external view returns (uint256 _reserveA, uint256 _reserveB)",
  "function tokenA() external view returns (address)",
  "function tokenB() external view returns (address)",
  "function reserveA() external view returns (uint256)",
  "function reserveB() external view returns (uint256)",
  "function balanceOf(address account) external view returns (uint256)",
  "function totalSupply() external view returns (uint256)"
];

export const ERC20_ABI = [
  "function name() external view returns (string)",
  "function symbol() external view returns (string)",
  "function decimals() external view returns (uint8)",
  "function totalSupply() external view returns (uint256)",
  "function balanceOf(address account) external view returns (uint256)",
  "function transfer(address to, uint256 amount) external returns (bool)",
  "function allowance(address owner, address spender) external view returns (uint256)",
  "function approve(address spender, uint256 amount) external returns (bool)",
  "function transferFrom(address from, address to, uint256 amount) external returns (bool)",
  "function mint(address to, uint256 amount) external"
];

// Contract addresses - Actualizadas con el deploy
export const CONTRACT_ADDRESSES = {
  // Para localhost/hardhat development
  localhost: {
    SimpleSwap: "0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0", 
    TokenA: "0x5FbDB2315678afecb367f032d93F642f64180aa3",    
    TokenB: "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512"     
  },
  // Para sepolia testnet - ACTUALIZADO CON EL DEPLOY
  sepolia: {
    SimpleSwap: "0x2843159d568Fa5e059Efd49f22e5A26542bfE392",
    TokenA: "0x2dD35434773eB36883408EdDEfe1e5D8B3DC54FF",    
    TokenB: "0x22A0aC9E38ce8843961A849C473279EC3c4AA332"     
  }
};

// Configuración de red simple
export const getNetworkConfig = (chainId) => {
  switch (chainId) {
    case 31337: // Hardhat local
    case 1337:  // Localhost
      return {
        name: 'localhost',
        contracts: CONTRACT_ADDRESSES.localhost
      };
    case 11155111: // Sepolia
      return {
        name: 'sepolia',
        contracts: CONTRACT_ADDRESSES.sepolia
      };
    default:
      return {
        name: 'localhost',
        contracts: CONTRACT_ADDRESSES.localhost
      };
  }
};

// Funciones helper para conexión con MetaMask
export const connectWallet = async () => {
  if (!window.ethereum) {
    throw new Error('MetaMask no está instalado. Por favor instálalo para continuar.');
  }

  try {
    // Solicitar conexión a MetaMask
    await window.ethereum.request({ method: 'eth_requestAccounts' });
    
    // Crear provider y signer
    const provider = new ethers.BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();
    const address = await signer.getAddress();
    const network = await provider.getNetwork();
    
    return {
      provider,
      signer,
      address,
      chainId: Number(network.chainId)
    };
  } catch (error) {
    throw new Error(`Error conectando wallet: ${error.message}`);
  }
};

export const switchToLocalNetwork = async () => {
  if (!window.ethereum) return;

  try {
    await window.ethereum.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: '0x7a69' }], // 31337 en hex
    });
  } catch (switchError) {
    // Si la red no existe, la agregamos
    if (switchError.code === 4902) {
      try {
        await window.ethereum.request({
          method: 'wallet_addEthereumChain',
          params: [{
            chainId: '0x7a69',
            chainName: 'Hardhat Local',
            rpcUrls: ['http://127.0.0.1:8545'],
            nativeCurrency: {
              name: 'ETH',
              symbol: 'ETH',
              decimals: 18
            }
          }]
        });
      } catch (addError) {
        throw new Error('Error agregando red local');
      }
    } else {
      throw new Error('Error cambiando a red local');
    }
  }
};

export const switchToSepoliaNetwork = async () => {
  if (!window.ethereum) return;

  try {
    await window.ethereum.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: '0xaa36a7' }], // 11155111 en hex
    });
  } catch (switchError) {
    // Si la red no existe, la agregamos
    if (switchError.code === 4902) {
      try {
        await window.ethereum.request({
          method: 'wallet_addEthereumChain',
          params: [{
            chainId: '0xaa36a7',
            chainName: 'Sepolia Testnet',
            rpcUrls: ['https://sepolia.infura.io/v3/'],
            nativeCurrency: {
              name: 'Sepolia ETH',
              symbol: 'ETH',
              decimals: 18
            },
            blockExplorerUrls: ['https://sepolia.etherscan.io']
          }]
        });
      } catch (addError) {
        throw new Error('Error agregando red Sepolia');
      }
    } else {
      throw new Error('Error cambiando a red Sepolia');
    }
  }
}; 