const { ethers } = require("hardhat");

async function main() {
  const [deployer] = await ethers.getSigners();

  console.log("Deploying contracts with the account:", deployer.address);
  console.log("Account balance:", (await ethers.provider.getBalance(deployer.address)).toString());

  // Deploy Test Tokens
  console.log("\n🪙 Deploying Test Tokens...");
  
  const TestTokenA = await ethers.getContractFactory("TestTokenA");
  const tokenA = await TestTokenA.deploy();
  await tokenA.waitForDeployment();
  console.log("TokenA deployed to:", tokenA.target);

  const TestTokenB = await ethers.getContractFactory("TestTokenB");
  const tokenB = await TestTokenB.deploy();
  await tokenB.waitForDeployment();
  console.log("TokenB deployed to:", tokenB.target);

  // Deploy SimpleSwap
  console.log("\n🔄 Deploying SimpleSwap...");
  
  const SimpleSwap = await ethers.getContractFactory("SimpleSwap");
  const simpleSwap = await SimpleSwap.deploy();
  await simpleSwap.waitForDeployment();
  console.log("SimpleSwap deployed to:", simpleSwap.target);

  // Initialize SimpleSwap
  console.log("\n⚙️ Initializing SimpleSwap...");
  const initTx = await simpleSwap.initialize(tokenA.target, tokenB.target);
  await initTx.wait();
  console.log("SimpleSwap initialized with tokens A and B");

  // Add initial liquidity (optional for testing)
  console.log("\n💧 Adding initial liquidity...");
  
  const amountA = ethers.parseEther("1000");
  const amountB = ethers.parseEther("2000");
  const deadline = Math.floor(Date.now() / 1000) + 3600;

  // Approve tokens
  await tokenA.approve(simpleSwap.target, amountA);
  await tokenB.approve(simpleSwap.target, amountB);

  const addLiquidityTx = await simpleSwap.addLiquidity(
    tokenA.target,
    tokenB.target,
    amountA,
    amountB,
    amountA,
    amountB,
    deployer.address,
    deadline
  );
  await addLiquidityTx.wait();
  console.log("Initial liquidity added: 1000 TTA : 2000 TTB");

  // Get reserves to verify
  const [reserveA, reserveB] = await simpleSwap.getReserves();
  console.log("Current reserves - TokenA:", ethers.formatEther(reserveA), "TokenB:", ethers.formatEther(reserveB));

  console.log("\n✅ Deployment complete!");
  console.log("\n📋 Contract Addresses:");
  console.log("TokenA (TTA):", tokenA.target);
  console.log("TokenB (TTB):", tokenB.target);
  console.log("SimpleSwap:", simpleSwap.target);

  // Save deployment info for frontend
  const deploymentInfo = {
    network: await ethers.provider.getNetwork(),
    contracts: {
      SimpleSwap: {
        address: simpleSwap.target,
        abi: "SimpleSwap" // Will be replaced by actual ABI in frontend
      },
      TokenA: {
        address: tokenA.target,
        symbol: "TTA",
        name: "Test Token A"
      },
      TokenB: {
        address: tokenB.target,
        symbol: "TTB", 
        name: "Test Token B"
      }
    },
    deployer: deployer.address,
    timestamp: new Date().toISOString()
  };

  console.log("\n📄 Deployment info:", JSON.stringify(deploymentInfo, null, 2));
  
  // For mainnet/testnet deployments, you might want to verify contracts
  if (network.name !== "hardhat" && network.name !== "localhost") {
    console.log("\n🔍 Verifying contracts on Etherscan...");
    try {
      await run("verify:verify", {
        address: tokenA.target,
        constructorArguments: [],
      });
      await run("verify:verify", {
        address: tokenB.target,
        constructorArguments: [],
      });
      await run("verify:verify", {
        address: simpleSwap.target,
        constructorArguments: [],
      });
      console.log("✅ Contracts verified successfully");
    } catch (error) {
      console.log("❌ Error verifying contracts:", error.message);
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 