const { buildModule } = require("@nomicfoundation/hardhat-ignition/modules");

module.exports = buildModule("TestDeployment", (m) => {
  // Deploy just one token to test
  const tokenA = m.contract("TestTokenA");
  
  return { tokenA };
}); 