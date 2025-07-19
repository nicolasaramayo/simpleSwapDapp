// Contract addresses for different networks
export const CONTRACT_ADDRESSES = {
  // Local development
  localhost: {
    SimpleSwap: "0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0",
    TokenA: "0x5FbDB2315678afecb367f032d93F642f64180aa3",
    TokenB: "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512"
  },
  // Sepolia testnet - DEPLOYED CONTRACTS
  sepolia: {
    SimpleSwap: "0x2843159d568Fa5e059Efd49f22e5A26542bfE392",
    TokenA: "0x2dD35434773eB36883408EdDEfe1e5D8B3DC54FF",
    TokenB: "0x22A0aC9E38ce8843961A849C473279EC3c4AA332"
  }
};

// Network configuration
export const NETWORKS = {
  31337: {
    name: 'Hardhat Local',
    chainId: '0x7a69',
    rpcUrl: 'http://127.0.0.1:8545',
    explorer: null,
    contracts: CONTRACT_ADDRESSES.localhost
  },
  11155111: {
    name: 'Sepolia Testnet',
    chainId: '0xaa36a7',
    rpcUrl: 'https://sepolia.infura.io/v3/',
    explorer: 'https://sepolia.etherscan.io',
    contracts: CONTRACT_ADDRESSES.sepolia
  }
};

// Get contract addresses for current network
export const getContractAddresses = (chainId) => {
  return NETWORKS[chainId]?.contracts || CONTRACT_ADDRESSES.localhost;
};

// Get network info
export const getNetworkInfo = (chainId) => {
  return NETWORKS[chainId] || NETWORKS[31337];
}; 