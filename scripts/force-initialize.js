const { ethers } = require("hardhat");

async function main() {
  const [deployer] = await ethers.getSigners();

  console.log("Force initializing SimpleSwap with account:", deployer.address);
  console.log("Account balance:", (await ethers.provider.getBalance(deployer.address)).toString());

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

  // Check current state
  const tokenAFromContract = await simpleSwap.tokenA();
  console.log("Current TokenA in contract:", tokenAFromContract);

  if (tokenAFromContract !== "0x0000000000000000000000000000000000000000") {
    console.log("Contract already initialized, skipping...");
    return;
  }

  // Initialize SimpleSwap
  console.log("\n⚙️ Initializing SimpleSwap...");
  try {
    const initTx = await simpleSwap.initialize(TOKEN_A_ADDRESS, TOKEN_B_ADDRESS);
    console.log("Initialization transaction hash:", initTx.hash);
    await initTx.wait();
    console.log("✅ SimpleSwap initialized successfully");
  } catch (error) {
    console.log("❌ Error initializing:", error.message);
    return;
  }

  // Verify initialization
  const newTokenA = await simpleSwap.tokenA();
  const newTokenB = await simpleSwap.tokenB();
  console.log("TokenA after init:", newTokenA);
  console.log("TokenB after init:", newTokenB);

  // Add initial liquidity
  console.log("\n💧 Adding initial liquidity...");
  
  const amountA = ethers.parseEther("1000");
  const amountB = ethers.parseEther("2000");
  const deadline = Math.floor(Date.now() / 1000) + 3600;

  // Check token balances first
  const tokenABalance = await tokenA.balanceOf(deployer.address);
  const tokenBBalance = await tokenB.balanceOf(deployer.address);
  
  console.log("TokenA balance:", ethers.formatEther(tokenABalance));
  console.log("TokenB balance:", ethers.formatEther(tokenBBalance));

  if (tokenABalance < amountA || tokenBBalance < amountB) {
    console.log("❌ Insufficient token balance for liquidity");
    return;
  }

  // Approve tokens
  console.log("Approving tokens...");
  try {
    const approveATx = await tokenA.approve(SIMPLE_SWAP_ADDRESS, amountA);
    await approveATx.wait();
    console.log("✅ TokenA approved");

    const approveBTx = await tokenB.approve(SIMPLE_SWAP_ADDRESS, amountB);
    await approveBTx.wait();
    console.log("✅ TokenB approved");
  } catch (error) {
    console.log("❌ Error approving tokens:", error.message);
    return;
  }

  // Add liquidity
  try {
    const addLiquidityTx = await simpleSwap.addLiquidity(
      TOKEN_A_ADDRESS,
      TOKEN_B_ADDRESS,
      amountA,
      amountB,
      amountA,
      amountB,
      deployer.address,
      deadline
    );
    console.log("Add liquidity transaction hash:", addLiquidityTx.hash);
    await addLiquidityTx.wait();
    console.log("✅ Initial liquidity added: 1000 TTA : 2000 TTB");
  } catch (error) {
    console.log("❌ Error adding liquidity:", error.message);
    return;
  }

  // Get final reserves to verify
  const [reserveA, reserveB] = await simpleSwap.getReserves();
  console.log("Final reserves - TokenA:", ethers.formatEther(reserveA), "TokenB:", ethers.formatEther(reserveB));

  console.log("\n🎉 SimpleSwap is ready to use!");
  console.log("\n📋 Contract Addresses:");
  console.log("TokenA (TTA):", TOKEN_A_ADDRESS);
  console.log("TokenB (TTB):", TOKEN_B_ADDRESS);
  console.log("SimpleSwap:", SIMPLE_SWAP_ADDRESS);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 