const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("SimpleSwap", function () {
  let simpleSwap, tokenA, tokenB, owner, user1, user2;

  beforeEach(async function () {
    [owner, user1, user2] = await ethers.getSigners();

    // Deploy test tokens
    const TestTokenA = await ethers.getContractFactory("TestTokenA");
    const TestTokenB = await ethers.getContractFactory("TestTokenB");
    tokenA = await TestTokenA.deploy();
    tokenB = await TestTokenB.deploy();

    // Deploy SimpleSwap
    const SimpleSwap = await ethers.getContractFactory("SimpleSwap");
    simpleSwap = await SimpleSwap.deploy();

    // Mint tokens for testing
    await tokenA.mint(user1.address, ethers.parseEther("10000"));
    await tokenA.mint(user2.address, ethers.parseEther("10000"));
    await tokenB.mint(user1.address, ethers.parseEther("10000"));
    await tokenB.mint(user2.address, ethers.parseEther("10000"));
  });

  describe("Initialization", function () {
    it("Should initialize correctly", async function () {
      await simpleSwap.initialize(tokenA.target, tokenB.target);
      
      expect(await simpleSwap.tokenA()).to.equal(tokenA.target);
      expect(await simpleSwap.tokenB()).to.equal(tokenB.target);
      expect(await simpleSwap.reserveA()).to.equal(0n);
      expect(await simpleSwap.reserveB()).to.equal(0n);
      expect(await simpleSwap.totalSupply()).to.equal(0n);
    });

    it("Should not allow double initialization", async function () {
      await simpleSwap.initialize(tokenA.target, tokenB.target);
      
      await expect(
        simpleSwap.initialize(tokenA.target, tokenB.target)
      ).to.be.revertedWith("Already initialized");
    });

    it("Should not allow initialization with identical tokens", async function () {
      await expect(
        simpleSwap.initialize(tokenA.target, tokenA.target)
      ).to.be.revertedWith("Identical tokens");
    });

    it("Should not allow initialization with zero address", async function () {
      await expect(
        simpleSwap.initialize(ethers.ZeroAddress, tokenB.target)
      ).to.be.revertedWith("Zero address");
    });
  });

  describe("Add Liquidity", function () {
    beforeEach(async function () {
      await simpleSwap.initialize(tokenA.target, tokenB.target);
      await tokenA.connect(user1).approve(simpleSwap.target, ethers.parseEther("10000"));
      await tokenB.connect(user1).approve(simpleSwap.target, ethers.parseEther("10000"));
    });

    it("Should add initial liquidity correctly", async function () {
      const amountA = ethers.parseEther("100");
      const amountB = ethers.parseEther("200");
      const deadline = Math.floor(Date.now() / 1000) + 3600;

      await expect(
        simpleSwap.connect(user1).addLiquidity(
          tokenA.target,
          tokenB.target,
          amountA,
          amountB,
          amountA,
          amountB,
          user1.address,
          deadline
        )
      ).to.emit(simpleSwap, "LiquidityAdded");

      expect(await simpleSwap.reserveA()).to.equal(amountA);
      expect(await simpleSwap.reserveB()).to.equal(amountB);
      expect(await simpleSwap.balanceOf(user1.address)).to.be.greaterThan(0n);
    });

    it("Should add liquidity with existing reserves", async function () {
      const deadline = Math.floor(Date.now() / 1000) + 3600;

      // Add initial liquidity
      await simpleSwap.connect(user1).addLiquidity(
        tokenA.target,
        tokenB.target,
        ethers.parseEther("100"),
        ethers.parseEther("200"),
        ethers.parseEther("100"),
        ethers.parseEther("200"),
        user1.address,
        deadline
      );

      // Add more liquidity
      await tokenA.connect(user2).approve(simpleSwap.target, ethers.parseEther("10000"));
      await tokenB.connect(user2).approve(simpleSwap.target, ethers.parseEther("10000"));

      await simpleSwap.connect(user2).addLiquidity(
        tokenA.target,
        tokenB.target,
        ethers.parseEther("50"),
        ethers.parseEther("100"),
        ethers.parseEther("25"),
        ethers.parseEther("50"),
        user2.address,
        deadline
      );

      expect(await simpleSwap.balanceOf(user2.address)).to.be.greaterThan(0n);
    });

    it("Should revert if deadline expired", async function () {
      const pastDeadline = Math.floor(Date.now() / 1000) - 3600;

      await expect(
        simpleSwap.connect(user1).addLiquidity(
          tokenA.target,
          tokenB.target,
          ethers.parseEther("100"),
          ethers.parseEther("200"),
          ethers.parseEther("100"),
          ethers.parseEther("200"),
          user1.address,
          pastDeadline
        )
      ).to.be.revertedWith("Transaction expired");
    });
  });

  describe("Remove Liquidity", function () {
    beforeEach(async function () {
      await simpleSwap.initialize(tokenA.target, tokenB.target);
      await tokenA.connect(user1).approve(simpleSwap.target, ethers.parseEther("10000"));
      await tokenB.connect(user1).approve(simpleSwap.target, ethers.parseEther("10000"));
      
      // Add initial liquidity
      const deadline = Math.floor(Date.now() / 1000) + 3600;
      await simpleSwap.connect(user1).addLiquidity(
        tokenA.target,
        tokenB.target,
        ethers.parseEther("100"),
        ethers.parseEther("200"),
        ethers.parseEther("100"),
        ethers.parseEther("200"),
        user1.address,
        deadline
      );
    });

    it("Should remove liquidity correctly", async function () {
      const liquidityBalance = await simpleSwap.balanceOf(user1.address);
      const halfLiquidity = liquidityBalance / 2n;
      const deadline = Math.floor(Date.now() / 1000) + 3600;

      await expect(
        simpleSwap.connect(user1).removeLiquidity(
          tokenA.target,
          tokenB.target,
          halfLiquidity,
          0,
          0,
          user1.address,
          deadline
        )
      ).to.emit(simpleSwap, "LiquidityRemoved");
    });

    it("Should revert if insufficient liquidity balance", async function () {
      const deadline = Math.floor(Date.now() / 1000) + 3600;

      await expect(
        simpleSwap.connect(user2).removeLiquidity(
          tokenA.target,
          tokenB.target,
          ethers.parseEther("1"),
          0,
          0,
          user2.address,
          deadline
        )
      ).to.be.revertedWith("Insufficient balance");
    });
  });

  describe("Swap Functions", function () {
    beforeEach(async function () {
      await simpleSwap.initialize(tokenA.target, tokenB.target);
      await tokenA.connect(user1).approve(simpleSwap.target, ethers.parseEther("10000"));
      await tokenB.connect(user1).approve(simpleSwap.target, ethers.parseEther("10000"));
      
      // Add initial liquidity
      const deadline = Math.floor(Date.now() / 1000) + 3600;
      await simpleSwap.connect(user1).addLiquidity(
        tokenA.target,
        tokenB.target,
        ethers.parseEther("1000"),
        ethers.parseEther("2000"),
        ethers.parseEther("1000"),
        ethers.parseEther("2000"),
        user1.address,
        deadline
      );
    });

    it("Should swap tokens correctly", async function () {
      await tokenA.connect(user2).approve(simpleSwap.target, ethers.parseEther("100"));
      const deadline = Math.floor(Date.now() / 1000) + 3600;

      await expect(
        simpleSwap.connect(user2).swapExactTokensForTokens(
          ethers.parseEther("10"),
          0,
          [tokenA.target, tokenB.target],
          user2.address,
          deadline
        )
      ).to.emit(simpleSwap, "Swap");
    });

    it("Should revert swap with invalid path", async function () {
      await tokenA.connect(user2).approve(simpleSwap.target, ethers.parseEther("100"));
      const deadline = Math.floor(Date.now() / 1000) + 3600;

      await expect(
        simpleSwap.connect(user2).swapExactTokensForTokens(
          ethers.parseEther("10"),
          0,
          [tokenA.target],
          user2.address,
          deadline
        )
      ).to.be.revertedWith("Invalid path");
    });
  });

  describe("View Functions", function () {
    beforeEach(async function () {
      await simpleSwap.initialize(tokenA.target, tokenB.target);
      await tokenA.connect(user1).approve(simpleSwap.target, ethers.parseEther("10000"));
      await tokenB.connect(user1).approve(simpleSwap.target, ethers.parseEther("10000"));
      
      // Add initial liquidity
      const deadline = Math.floor(Date.now() / 1000) + 3600;
      await simpleSwap.connect(user1).addLiquidity(
        tokenA.target,
        tokenB.target,
        ethers.parseEther("1000"),
        ethers.parseEther("2000"),
        ethers.parseEther("1000"),
        ethers.parseEther("2000"),
        user1.address,
        deadline
      );
    });

    it("Should return correct amount out", async function () {
      // Use the version with token addresses (address, address, uint256)
      const amountOut = await simpleSwap["getAmountOut(address,address,uint256)"](
        tokenA.target,
        tokenB.target,
        ethers.parseEther("10")
      );
      expect(amountOut).to.be.greaterThan(0n);
    });

    it("Should return correct price", async function () {
      const price = await simpleSwap.getPrice(tokenA.target, tokenB.target);
      expect(price).to.be.greaterThan(0n);
    });

    it("Should return correct reserves", async function () {
      const [reserveA, reserveB] = await simpleSwap.getReserves();
      expect(reserveA).to.equal(ethers.parseEther("1000"));
      expect(reserveB).to.equal(ethers.parseEther("2000"));
    });

    it("Should calculate amount out with reserves", async function () {
      // Use the version with reserves (uint256, uint256, uint256)
      const amountOut = await simpleSwap["getAmountOut(uint256,uint256,uint256)"](
        ethers.parseEther("10"),
        ethers.parseEther("1000"),
        ethers.parseEther("2000")
      );
      expect(amountOut).to.be.greaterThan(0n);
    });
  });

  describe("Edge Cases", function () {
    it("Should handle auto-initialization in addLiquidity", async function () {
      await tokenA.connect(user1).approve(simpleSwap.target, ethers.parseEther("10000"));
      await tokenB.connect(user1).approve(simpleSwap.target, ethers.parseEther("10000"));
      
      const deadline = Math.floor(Date.now() / 1000) + 3600;

      await expect(
        simpleSwap.connect(user1).addLiquidity(
          tokenA.target,
          tokenB.target,
          ethers.parseEther("100"),
          ethers.parseEther("200"),
          ethers.parseEther("100"),
          ethers.parseEther("200"),
          user1.address,
          deadline
        )
      ).to.emit(simpleSwap, "LiquidityAdded");
    });

    it("Should revert with invalid input amounts", async function () {
      await simpleSwap.initialize(tokenA.target, tokenB.target);
      const deadline = Math.floor(Date.now() / 1000) + 3600;

      await expect(
        simpleSwap.connect(user1).swapExactTokensForTokens(
          0,
          0,
          [tokenA.target, tokenB.target],
          user1.address,
          deadline
        )
      ).to.be.revertedWith("Invalid input");
    });
  });
}); 