const { ethers } = require("hardhat");

async function main() {
  const [deployer] = await ethers.getSigners();

  console.log("Checking contract state with account:", deployer.address);

  // Contract addresses
  const SIMPLE_SWAP_ADDRESS = "0x2843159d568Fa5e059Efd49f22e5A26542bfE392";
  const TOKEN_A_ADDRESS = "0x2dD35434773eB36883408EdDEfe1e5D8B3DC54FF";
  const TOKEN_B_ADDRESS = "0x22A0aC9E38ce8843961A849C473279EC3c4AA332";

  // Get contract instances
  const SimpleSwap = await ethers.getContractFactory("SimpleSwap");
  const simpleSwap = SimpleSwap.attach(SIMPLE_SWAP_ADDRESS);

  const TestTokenA = await ethers.getContractFactory("TestTokenA");
  const tokenA = TestTokenA.attach(TOKEN_A_ADDRESS);

  const TestTokenB = await ethers.getContractFactory("TestTokenB");
  const tokenB = TestTokenB.attach(TOKEN_B_ADDRESS);

  console.log("\n📋 Contract Information:");
  console.log("SimpleSwap address:", SIMPLE_SWAP_ADDRESS);
  console.log("TokenA address:", TOKEN_A_ADDRESS);
  console.log("TokenB address:", TOKEN_B_ADDRESS);

  // Check token balances
  const tokenABalance = await tokenA.balanceOf(deployer.address);
  const tokenBBalance = await tokenB.balanceOf(deployer.address);
  
  console.log("\n💰 Token Balances:");
  console.log("TokenA balance:", ethers.formatEther(tokenABalance));
  console.log("TokenB balance:", ethers.formatEther(tokenBBalance));

  // Check SimpleSwap state
  try {
    const tokenAFromContract = await simpleSwap.tokenA();
    const tokenBFromContract = await simpleSwap.tokenB();
    const [reserveA, reserveB] = await simpleSwap.getReserves();
    
    console.log("\n🔄 SimpleSwap State:");
    console.log("TokenA in contract:", tokenAFromContract);
    console.log("TokenB in contract:", tokenBFromContract);
    console.log("ReserveA:", ethers.formatEther(reserveA));
    console.log("ReserveB:", ethers.formatEther(reserveB));
    
    if (tokenAFromContract === "0x0000000000000000000000000000000000000000") {
      console.log("\n❌ Contract not initialized properly");
    } else {
      console.log("\n✅ Contract is initialized");
    }
  } catch (error) {
    console.log("\n❌ Error reading contract state:", error.message);
  }

  // Check allowances
  const allowanceA = await tokenA.allowance(deployer.address, SIMPLE_SWAP_ADDRESS);
  const allowanceB = await tokenB.allowance(deployer.address, SIMPLE_SWAP_ADDRESS);
  
  console.log("\n🔐 Allowances:");
  console.log("TokenA allowance:", ethers.formatEther(allowanceA));
  console.log("TokenB allowance:", ethers.formatEther(allowanceB));
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 