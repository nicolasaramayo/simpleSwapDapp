const { buildModule } = require("@nomicfoundation/hardhat-ignition/modules");

module.exports = buildModule("SimpleSwapDeployment", (m) => {
  // Deploy Test Tokens
  const tokenA = m.contract("TestTokenA");
  const tokenB = m.contract("TestTokenB");
  
  // Deploy SimpleSwap
  const simpleSwap = m.contract("SimpleSwap");
  
  return { tokenA, tokenB, simpleSwap };
}); 