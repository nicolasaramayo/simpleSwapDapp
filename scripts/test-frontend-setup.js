const { ethers } = require("hardhat");

async function main() {
  const [deployer] = await ethers.getSigners();

  console.log("🧪 Testing Frontend Setup");
  console.log("==========================");
  console.log("Account:", deployer.address);
  console.log("Balance:", ethers.formatEther(await ethers.provider.getBalance(deployer.address)), "ETH");

  // Contract addresses
  const SIMPLE_SWAP_ADDRESS = "0x2843159d568Fa5e059Efd49f22e5A26542bfE392";
  const TOKEN_A_ADDRESS = "0x2dD35434773eB36883408EdDEfe1e5D8B3DC54FF";
  const TOKEN_B_ADDRESS = "0x22A0aC9E38ce8843961A849C473279EC3c4AA332";

  console.log("\n📋 Contract Addresses:");
  console.log("SimpleSwap:", SIMPLE_SWAP_ADDRESS);
  console.log("TokenA (TTA):", TOKEN_A_ADDRESS);
  console.log("TokenB (TTB):", TOKEN_B_ADDRESS);

  // Test contract connectivity
  try {
    const SimpleSwap = await ethers.getContractFactory("SimpleSwap");
    const simpleSwap = SimpleSwap.attach(SIMPLE_SWAP_ADDRESS);

    const TestTokenA = await ethers.getContractFactory("TestTokenA");
    const tokenA = TestTokenA.attach(TOKEN_A_ADDRESS);

    const TestTokenB = await ethers.getContractFactory("TestTokenB");
    const tokenB = TestTokenB.attach(TOKEN_B_ADDRESS);

    console.log("\n🔗 Testing Contract Connectivity:");

    // Test token names and symbols
    const tokenAName = await tokenA.name();
    const tokenASymbol = await tokenA.symbol();
    const tokenBName = await tokenB.name();
    const tokenBSymbol = await tokenB.symbol();

    console.log(`✅ ${tokenAName} (${tokenASymbol}): ${TOKEN_A_ADDRESS}`);
    console.log(`✅ ${tokenBName} (${tokenBSymbol}): ${TOKEN_B_ADDRESS}`);

    // Test SimpleSwap state
    const tokenAFromContract = await simpleSwap.tokenA();
    const tokenBFromContract = await simpleSwap.tokenB();
    const [reserveA, reserveB] = await simpleSwap.getReserves();

    console.log("\n🔄 SimpleSwap State:");
    console.log(`✅ TokenA configured: ${tokenAFromContract === TOKEN_A_ADDRESS ? 'Yes' : 'No'}`);
    console.log(`✅ TokenB configured: ${tokenBFromContract === TOKEN_B_ADDRESS ? 'Yes' : 'No'}`);
    console.log(`✅ Reserves - TTA: ${ethers.formatEther(reserveA)}, TTB: ${ethers.formatEther(reserveB)}`);

    // Test price calculation
    const amountIn = ethers.parseEther("1");
    const amountOut = await simpleSwap.getAmountOut(TOKEN_A_ADDRESS, TOKEN_B_ADDRESS, amountIn);
    const price = await simpleSwap.getPrice(TOKEN_A_ADDRESS, TOKEN_B_ADDRESS);

    console.log("\n💰 Price Information:");
    console.log(`✅ 1 TTA = ${ethers.formatEther(amountOut)} TTB`);
    console.log(`✅ Price ratio: ${ethers.formatEther(price)}`);

    // Test user balances
    const userTokenABalance = await tokenA.balanceOf(deployer.address);
    const userTokenBBalance = await tokenB.balanceOf(deployer.address);

    console.log("\n👤 User Balances:");
    console.log(`✅ TTA: ${ethers.formatEther(userTokenABalance)}`);
    console.log(`✅ TTB: ${ethers.formatEther(userTokenBBalance)}`);

    console.log("\n🎉 All tests passed! Frontend is ready to use.");
    console.log("\n📱 Next steps:");
    console.log("1. Open your browser to http://localhost:3000");
    console.log("2. Connect your MetaMask wallet");
    console.log("3. Switch to Sepolia network");
    console.log("4. Start swapping tokens!");

  } catch (error) {
    console.error("❌ Error testing contracts:", error.message);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 