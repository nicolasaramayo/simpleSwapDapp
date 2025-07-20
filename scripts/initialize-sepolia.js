const { ethers } = require("hardhat");

async function main() {
  const [deployer] = await ethers.getSigners();

  console.log("Initializing SimpleSwap with the account:", deployer.address);
  console.log("Account balance:", (await ethers.provider.getBalance(deployer.address)).toString());

  // Contract addresses from deployment
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

  // Check if already initialized
  try {
    const tokenAFromContract = await simpleSwap.tokenA();
    console.log("Contract already initialized with TokenA:", tokenAFromContract);
    return;
  } catch (error) {
    console.log("Contract not initialized yet, proceeding...");
  }

  // Initialize SimpleSwap
  console.log("\n⚙️ Initializing SimpleSwap...");
  const initTx = await simpleSwap.initialize(TOKEN_A_ADDRESS, TOKEN_B_ADDRESS);
  await initTx.wait();
  console.log("✅ SimpleSwap initialized with tokens A and B");

  // Add initial liquidity
  console.log("\n💧 Adding initial liquidity...");
  
  const amountA = ethers.parseEther("1000");
  const amountB = ethers.parseEther("2000");
  const deadline = Math.floor(Date.now() / 1000) + 3600;

  // Approve tokens
  console.log("Approving tokens...");
  await tokenA.approve(SIMPLE_SWAP_ADDRESS, amountA);
  await tokenB.approve(SIMPLE_SWAP_ADDRESS, amountB);

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
  await addLiquidityTx.wait();
  console.log("✅ Initial liquidity added: 1000 TTA : 2000 TTB");

  // Get reserves to verify
  const [reserveA, reserveB] = await simpleSwap.getReserves();
  console.log("Current reserves - TokenA:", ethers.formatEther(reserveA), "TokenB:", ethers.formatEther(reserveB));

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