const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("SimpleSwap", function () {
  let simpleSwap, tokenA, tokenB, owner, user1;

  beforeEach(async function () {
    [owner, user1] = await ethers.getSigners();

    // Deploy simple tokens
    const SimpleToken = await ethers.getContractFactory("SimpleToken");
    tokenA = await SimpleToken.deploy("Token A", "TKA");
    tokenB = await SimpleToken.deploy("Token B", "TKB");

    // Deploy SimpleSwap
    const SimpleSwap = await ethers.getContractFactory("SimpleSwap");
    simpleSwap = await SimpleSwap.deploy();

    // Mint tokens
    await tokenA.mint(user1.address, ethers.parseEther("1000"));
    await tokenB.mint(user1.address, ethers.parseEther("1000"));
  });

  describe("Initialization", function () {
    it("Should initialize correctly", async function () {
      await simpleSwap.initialize(tokenA.target, tokenB.target);
      expect(await simpleSwap.tokenA()).to.equal(tokenA.target);
      expect(await simpleSwap.tokenB()).to.equal(tokenB.target);
    });

    it("Should not allow double initialization", async function () {
      await simpleSwap.initialize(tokenA.target, tokenB.target);
      await expect(simpleSwap.initialize(tokenA.target, tokenB.target))
        .to.be.revertedWith("Already initialized");
    });

    it("Should not allow identical tokens", async function () {
      await expect(simpleSwap.initialize(tokenA.target, tokenA.target))
        .to.be.revertedWith("Identical tokens");
    });

    it("Should not allow zero address", async function () {
      await expect(simpleSwap.initialize(ethers.ZeroAddress, tokenB.target))
        .to.be.revertedWith("Zero address");
    });
  });

  describe("Add Liquidity", function () {
    beforeEach(async function () {
      await simpleSwap.initialize(tokenA.target, tokenB.target);
      await tokenA.connect(user1).approve(simpleSwap.target, ethers.parseEther("1000"));
      await tokenB.connect(user1).approve(simpleSwap.target, ethers.parseEther("1000"));
    });

    it("Should add initial liquidity", async function () {
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
      expect(await simpleSwap.reserveA()).to.equal(ethers.parseEther("100"));
    });

    it("Should revert if deadline expired", async function () {
      const pastDeadline = Math.floor(Date.now() / 1000) - 3600;
      await expect(simpleSwap.connect(user1).addLiquidity(
        tokenA.target,
        tokenB.target,
        ethers.parseEther("100"),
        ethers.parseEther("200"),
        ethers.parseEther("100"),
        ethers.parseEther("200"),
        user1.address,
        pastDeadline
      )).to.be.revertedWith("Transaction expired");
    });
  });

  describe("Remove Liquidity", function () {
    beforeEach(async function () {
      await simpleSwap.initialize(tokenA.target, tokenB.target);
      await tokenA.connect(user1).approve(simpleSwap.target, ethers.parseEther("1000"));
      await tokenB.connect(user1).approve(simpleSwap.target, ethers.parseEther("1000"));
      
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

    it("Should remove liquidity", async function () {
      const liquidityBalance = await simpleSwap.balanceOf(user1.address);
      const deadline = Math.floor(Date.now() / 1000) + 3600;
      await simpleSwap.connect(user1).removeLiquidity(
        tokenA.target,
        tokenB.target,
        liquidityBalance,
        0,
        0,
        user1.address,
        deadline
      );
    });

    it("Should revert if insufficient balance", async function () {
      const deadline = Math.floor(Date.now() / 1000) + 3600;
      await expect(simpleSwap.connect(owner).removeLiquidity(
        tokenA.target,
        tokenB.target,
        ethers.parseEther("1"),
        0,
        0,
        owner.address,
        deadline
      )).to.be.revertedWith("Insufficient balance");
    });
  });

  describe("Swap Functions", function () {
    beforeEach(async function () {
      await simpleSwap.initialize(tokenA.target, tokenB.target);
      await tokenA.connect(user1).approve(simpleSwap.target, ethers.parseEther("1000"));
      await tokenB.connect(user1).approve(simpleSwap.target, ethers.parseEther("1000"));
      
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

    it("Should swap tokens", async function () {
      await tokenA.connect(user1).approve(simpleSwap.target, ethers.parseEther("100"));
      const deadline = Math.floor(Date.now() / 1000) + 3600;
      await simpleSwap.connect(user1).swapExactTokensForTokens(
        ethers.parseEther("10"),
        0,
        [tokenA.target, tokenB.target],
        user1.address,
        deadline
      );
    });

    it("Should revert with invalid path", async function () {
      await tokenA.connect(user1).approve(simpleSwap.target, ethers.parseEther("100"));
      const deadline = Math.floor(Date.now() / 1000) + 3600;
      await expect(simpleSwap.connect(user1).swapExactTokensForTokens(
        ethers.parseEther("10"),
        0,
        [tokenA.target],
        user1.address,
        deadline
      )).to.be.revertedWith("Invalid path");
    });

    it("Should revert with invalid input", async function () {
      const deadline = Math.floor(Date.now() / 1000) + 3600;
      await expect(simpleSwap.connect(user1).swapExactTokensForTokens(
        0,
        0,
        [tokenA.target, tokenB.target],
        user1.address,
        deadline
      )).to.be.revertedWith("Invalid input");
    });
  });

  describe("View Functions", function () {
    beforeEach(async function () {
      await simpleSwap.initialize(tokenA.target, tokenB.target);
      await tokenA.connect(user1).approve(simpleSwap.target, ethers.parseEther("1000"));
      await tokenB.connect(user1).approve(simpleSwap.target, ethers.parseEther("1000"));
      
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

    it("Should return amount out", async function () {
      const amountOut = await simpleSwap["getAmountOut(address,address,uint256)"](
        tokenA.target,
        tokenB.target,
        ethers.parseEther("10")
      );
      expect(amountOut).to.be.greaterThan(0n);
    });

    it("Should return price", async function () {
      const price = await simpleSwap.getPrice(tokenA.target, tokenB.target);
      expect(price).to.be.greaterThan(0n);
    });

    it("Should return reserves", async function () {
      const [reserveA, reserveB] = await simpleSwap.getReserves();
      expect(reserveA).to.equal(ethers.parseEther("100"));
      expect(reserveB).to.equal(ethers.parseEther("200"));
    });

    it("Should calculate amount out with reserves", async function () {
      const amountOut = await simpleSwap["getAmountOut(uint256,uint256,uint256)"](
        ethers.parseEther("10"),
        ethers.parseEther("100"),
        ethers.parseEther("200")
      );
      expect(amountOut).to.be.greaterThan(0n);
    });
  });

  describe("Edge Cases", function () {
    it("Should auto-initialize in addLiquidity", async function () {
      await tokenA.connect(user1).approve(simpleSwap.target, ethers.parseEther("1000"));
      await tokenB.connect(user1).approve(simpleSwap.target, ethers.parseEther("1000"));
      
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
      expect(await simpleSwap.tokenA()).to.equal(tokenA.target);
    });
  });
}); 