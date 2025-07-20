const { buildModule } = require("@nomicfoundation/hardhat-ignition/modules");

module.exports = buildModule("SimpleSwapDeployment", (m) => {
  // Deploy Simple Tokens
  const tokenA = m.contract("SimpleToken", ["Token A", "TKA"]);
  const tokenB = m.contract("SimpleToken", ["Token B", "TKB"]);
  
  // Deploy SimpleSwap
  const simpleSwap = m.contract("SimpleSwap");
  
  return { tokenA, tokenB, simpleSwap };
}); 