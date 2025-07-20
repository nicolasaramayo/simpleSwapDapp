// Production configuration for Vercel deployment
export const PRODUCTION_CONFIG = {
  network: 'sepolia',
  chainId: 11155111,
  rpcUrl: 'https://sepolia.infura.io/v3/',
  explorerUrl: 'https://sepolia.etherscan.io',
  contracts: {
    SimpleSwap: "0x2843159d568Fa5e059Efd49f22e5A26542bfE392",
    TokenA: "0x2dD35434773eB36883408EdDEfe1e5D8B3DC54FF",
    TokenB: "0x22A0aC9E38ce8843961A849C473279EC3c4AA332"
  }
};

// Environment detection
export const isProduction = () => {
  return process.env.NODE_ENV === 'production' || 
         window.location.hostname !== 'localhost';
};

// Get configuration based on environment
export const getConfig = () => {
  if (isProduction()) {
    return PRODUCTION_CONFIG;
  }
  // Return development config (from web3.js)
  return {
    network: 'localhost',
    chainId: 31337,
    contracts: {
      SimpleSwap: "0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0",
      TokenA: "0x5FbDB2315678afecb367f032d93F642f64180aa3",
      TokenB: "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512"
    }
  };
}; 