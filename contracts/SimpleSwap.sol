// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

interface IERC20 {
    function totalSupply() external view returns (uint256);
    function balanceOf(address account) external view returns (uint256);
    function transfer(address to, uint256 value) external returns (bool);
    function allowance(address owner, address spender) external view returns (uint256);
    function approve(address spender, uint256 value) external returns (bool);
    function transferFrom(address from, address to, uint256 value) external returns (bool);
}

/**
 * @title SimpleSwap
 * @notice A simplified DEX for a single token pair
 * @dev Implements basic functionality
 */
contract SimpleSwap {
    
    // State variables for the unique pair
    address public tokenA;
    address public tokenB;
    uint256 public reserveA;
    uint256 public reserveB;
    uint256 public totalSupply;
    
    mapping(address => uint256) public balanceOf;
    
    // Constant for minimum liquidity
    uint256 private constant MINIMUM_LIQUIDITY = 1000;
    
    // Events
    event LiquidityAdded(address indexed user, uint256 amountA, uint256 amountB, uint256 liquidity);
    event LiquidityRemoved(address indexed user, uint256 amountA, uint256 amountB, uint256 liquidity);
    event Swap(address indexed user, address tokenIn, address tokenOut, uint256 amountIn, uint256 amountOut);
    
    /**
     * @notice Initializes the token pair
     * @param _tokenA Address of token A
     * @param _tokenB Address of token B
     */
    function initialize(address _tokenA, address _tokenB) external {
        require(tokenA == address(0), "Already initialized");
        require(_tokenA != _tokenB, "Identical tokens");
        require(_tokenA != address(0) && _tokenB != address(0), "Zero address");
        
        tokenA = _tokenA;
        tokenB = _tokenB;
    }
    
    /**
     * @notice Adds liquidity to the pool
     * @param _tokenA Address of token A
     * @param _tokenB Address of token B
     * @param amountADesired Desired amount of token A
     * @param amountBDesired Desired amount of token B
     * @param amountAMin Minimum amount of token A
     * @param amountBMin Minimum amount of token B
     * @param to Address that receives the liquidity tokens
     * @param deadline Time limit for the transaction
     * @return amountA Actual amount of token A added
     * @return amountB Actual amount of token B added
     * @return liquidity Liquidity tokens minted
     */
    function addLiquidity(
        address _tokenA,
        address _tokenB,
        uint256 amountADesired,
        uint256 amountBDesired,
        uint256 amountAMin,
        uint256 amountBMin,
        address to,
        uint256 deadline
    ) external returns (uint256 amountA, uint256 amountB, uint256 liquidity) {
        require(block.timestamp <= deadline, "Transaction expired");
        require(to != address(0), "Zero address");
        
        // Cache state variables to avoid multiple SLOAD operations
        address _cachedTokenA = tokenA;
        address _cachedTokenB = tokenB;
        uint256 _cachedReserveA = reserveA;
        uint256 _cachedReserveB = reserveB;
        uint256 _cachedTotalSupply = totalSupply;
        
        // Auto-initialize if not initialized
        if (_cachedTokenA == address(0)) {
            require(_tokenA != _tokenB, "Identical tokens");
            require(_tokenA != address(0) && _tokenB != address(0), "Zero address");
            tokenA = _tokenA;
            tokenB = _tokenB;
            _cachedTokenA = _tokenA;
            _cachedTokenB = _tokenB;
        } else {
            require(_tokenA == _cachedTokenA && _tokenB == _cachedTokenB, "Invalid tokens");
        }
        
        // Calculate amounts
        (amountA, amountB) = _calculateLiquidityAmounts(
            amountADesired, 
            amountBDesired, 
            amountAMin, 
            amountBMin
        );
        
        // Transfer tokens
        IERC20(_cachedTokenA).transferFrom(msg.sender, address(this), amountA);
        IERC20(_cachedTokenB).transferFrom(msg.sender, address(this), amountB);
        
        // Calculate liquidity to mint
        if (_cachedTotalSupply == 0) {
            liquidity = _sqrt(amountA * amountB) - MINIMUM_LIQUIDITY;
            balanceOf[address(0)] = MINIMUM_LIQUIDITY; // Initial lock
        } else {
            liquidity = _min(
                (amountA * _cachedTotalSupply) / _cachedReserveA,
                (amountB * _cachedTotalSupply) / _cachedReserveB
            );
        }
        
        require(liquidity > 0, "Insufficient liquidity");
        
        // Update state
        balanceOf[to] += liquidity;
        totalSupply = _cachedTotalSupply + liquidity;
        reserveA = _cachedReserveA + amountA;
        reserveB = _cachedReserveB + amountB;
        
        emit LiquidityAdded(to, amountA, amountB, liquidity);
    }

    /**
     * @notice Removes liquidity from the pool
     * @param _tokenA Address of token A
     * @param _tokenB Address of token B
     * @param liquidity Amount of liquidity tokens to burn
     * @param amountAMin Minimum amount of token A to receive
     * @param amountBMin Minimum amount of token B to receive
     * @param to Address that receives the tokens
     * @param deadline Time limit for the transaction
     * @return amountA Amount of token A received
     * @return amountB Amount of token B received
     */
    function removeLiquidity(
        address _tokenA,
        address _tokenB,
        uint256 liquidity,
        uint256 amountAMin,
        uint256 amountBMin,
        address to,
        uint256 deadline
    ) external returns (uint256 amountA, uint256 amountB) {
        require(block.timestamp <= deadline, "Transaction expired");
        require(liquidity > 0, "Invalid amount");
        require(to != address(0), "Zero address");
        
        // Cache state variables to avoid multiple SLOAD operations
        address _cachedTokenA = tokenA;
        address _cachedTokenB = tokenB;
        uint256 _cachedReserveA = reserveA;
        uint256 _cachedReserveB = reserveB;
        uint256 _cachedTotalSupply = totalSupply;
        uint256 _cachedBalance = balanceOf[msg.sender];
        
        require(_tokenA == _cachedTokenA && _tokenB == _cachedTokenB, "Invalid tokens");
        require(_cachedBalance >= liquidity, "Insufficient balance");
        
        // Calculate proportional amounts
        amountA = (liquidity * _cachedReserveA) / _cachedTotalSupply;
        amountB = (liquidity * _cachedReserveB) / _cachedTotalSupply;
        
        require(amountA >= amountAMin, "Insufficient A amount");
        require(amountB >= amountBMin, "Insufficient B amount");
        
        // Update state
        balanceOf[msg.sender] = _cachedBalance - liquidity;
        totalSupply = _cachedTotalSupply - liquidity;
        reserveA = _cachedReserveA - amountA;
        reserveB = _cachedReserveB - amountB;
        
        // Transfer tokens
        IERC20(_cachedTokenA).transfer(to, amountA);
        IERC20(_cachedTokenB).transfer(to, amountB);
        
        emit LiquidityRemoved(to, amountA, amountB, liquidity);
    }
    
    /**
     * @notice Swaps an exact amount of input tokens for output tokens
     * @param amountIn Amount of input tokens
     * @param amountOutMin Minimum amount of output tokens
     * @param path Array of token addresses [tokenIn, tokenOut]
     * @param to Address that receives the output tokens
     * @param deadline Time limit for the transaction
     */
    function swapExactTokensForTokens(
        uint256 amountIn,
        uint256 amountOutMin,
        address[] calldata path,
        address to,
        uint256 deadline
    ) external {
        require(block.timestamp <= deadline, "Transaction expired");
        require(amountIn > 0, "Invalid input");
        require(path.length == 2, "Invalid path");
        require(to != address(0), "Zero address");
        
        // Cache state variables to avoid multiple SLOAD operations
        address _cachedTokenA = tokenA;
        address _cachedTokenB = tokenB;
        uint256 _cachedReserveA = reserveA;
        uint256 _cachedReserveB = reserveB;
        
        address tokenIn = path[0];
        address tokenOut = path[1];
        
        require(tokenIn == _cachedTokenA || tokenIn == _cachedTokenB, "Invalid token");
        require(tokenOut == _cachedTokenA || tokenOut == _cachedTokenB, "Invalid token");
        require(tokenIn != tokenOut, "Same tokens");
        
        // Determine reserves
        uint256 reserveIn = tokenIn == _cachedTokenA ? _cachedReserveA : _cachedReserveB;
        uint256 reserveOut = tokenIn == _cachedTokenA ? _cachedReserveB : _cachedReserveA;
        
        // Calculate output using x * y = k formula
        uint256 amountOut = _getAmountOut(amountIn, reserveIn, reserveOut);
        require(amountOut >= amountOutMin, "Insufficient output");
        
        // Transfer tokens
        IERC20(tokenIn).transferFrom(msg.sender, address(this), amountIn);
        IERC20(tokenOut).transfer(to, amountOut);
        
        // Update reserves
        if (tokenIn == _cachedTokenA) {
            reserveA = _cachedReserveA + amountIn;
            reserveB = _cachedReserveB - amountOut;
        } else {
            reserveB = _cachedReserveB + amountIn;
            reserveA = _cachedReserveA - amountOut;
        }
        
        emit Swap(msg.sender, tokenIn, tokenOut, amountIn, amountOut);
    }
    
    /**
     * @notice Calculates the amount of tokens to receive for a given input
     * @param _tokenIn Address of input token
     * @param _tokenOut Address of output token
     * @param amountIn Amount of input tokens
     * @return amountOut Amount of output tokens to receive
     */
    function getAmountOut(
        address _tokenIn,
        address _tokenOut,
        uint256 amountIn
    ) public view returns (uint256 amountOut) {
        require(amountIn > 0, "Invalid input");
        require(_tokenIn != _tokenOut, "Same tokens");
        
        // Cache state variables to avoid multiple SLOAD operations
        address _cachedTokenA = tokenA;
        address _cachedTokenB = tokenB;
        uint256 _cachedReserveA = reserveA;
        uint256 _cachedReserveB = reserveB;
        
        require(_tokenIn == _cachedTokenA || _tokenIn == _cachedTokenB, "Invalid token");
        require(_tokenOut == _cachedTokenA || _tokenOut == _cachedTokenB, "Invalid token");
        require(_cachedReserveA > 0 && _cachedReserveB > 0, "No liquidity");
        
        uint256 reserveIn = _tokenIn == _cachedTokenA ? _cachedReserveA : _cachedReserveB;
        uint256 reserveOut = _tokenIn == _cachedTokenA ? _cachedReserveB : _cachedReserveA;
        
        // AMM formula: amountOut = (amountIn * reserveOut) / (reserveIn + amountIn)
        uint256 numerator = amountIn * reserveOut;
        uint256 denominator = reserveIn + amountIn;
        amountOut = numerator / denominator;
    }
    
    /**
     * @notice Calculates the amount of output tokens for a given input (verifier interface)
     * @param amountIn Amount of input tokens
     * @param reserveIn Reserve of input token
     * @param reserveOut Reserve of output token
     * @return Amount of output tokens to receive
     */
    function getAmountOut(
        uint256 amountIn,
        uint256 reserveIn,
        uint256 reserveOut
    ) external pure returns (uint256) {
        return _getAmountOut(amountIn, reserveIn, reserveOut);
    }
    
    /**
     * @notice Internal function to calculate output - maintains existing functionality
     * @param amountIn Amount of input tokens
     * @param reserveIn Reserve of input token
     * @param reserveOut Reserve of output token
     * @return amountOut Amount of output tokens
     */
    function _getAmountOut(
        uint256 amountIn,
        uint256 reserveIn,
        uint256 reserveOut
    ) internal pure returns (uint256 amountOut) {
        require(amountIn > 0, "Invalid input");
        require(reserveIn > 0 && reserveOut > 0, "Invalid reserves");
        
        // AMM formula: amountOut = (amountIn * reserveOut) / (reserveIn + amountIn)
        uint256 numerator = amountIn * reserveOut;
        uint256 denominator = reserveIn + amountIn;
        amountOut = numerator / denominator;
    }
    
    /**
     * @notice Gets the price of token A in terms of token B
     * @param _tokenA Address of token A
     * @param _tokenB Address of token B
     * @return price Price of token A in terms of token B (scaled by 1e18)
     */
    function getPrice(address _tokenA, address _tokenB) external view returns (uint256 price) {
        // Cache state variables to avoid multiple SLOAD operations
        address _cachedTokenA = tokenA;
        address _cachedTokenB = tokenB;
        uint256 _cachedReserveA = reserveA;
        uint256 _cachedReserveB = reserveB;
        
        require(_tokenA == _cachedTokenA && _tokenB == _cachedTokenB, "Invalid tokens");
        require(_cachedReserveA > 0 && _cachedReserveB > 0, "No liquidity");
        
        if (_tokenA == _cachedTokenA) {
            price = (_cachedReserveB * 1e18) / _cachedReserveA;
        } else {
            price = (_cachedReserveA * 1e18) / _cachedReserveB;
        }
    }
    
    /**
     * @notice Gets current reserves
     * @return _reserveA Reserve of token A
     * @return _reserveB Reserve of token B
     */
    function getReserves() external view returns (uint256 _reserveA, uint256 _reserveB) {
        _reserveA = reserveA;
        _reserveB = reserveB;
    }
    
    // Internal functions
    /**
     * @notice Calculates optimal amounts for adding liquidity
     * @param amountADesired Desired amount of token A
     * @param amountBDesired Desired amount of token B
     * @param amountAMin Minimum amount of token A
     * @param amountBMin Minimum amount of token B
     * @return amountA Optimal amount of token A
     * @return amountB Optimal amount of token B
     */
    function _calculateLiquidityAmounts(
        uint256 amountADesired,
        uint256 amountBDesired,
        uint256 amountAMin,
        uint256 amountBMin
    ) internal view returns (uint256 amountA, uint256 amountB) {
        // Cache state variables to avoid multiple SLOAD operations
        uint256 _cachedReserveA = reserveA;
        uint256 _cachedReserveB = reserveB;
        
        if (_cachedReserveA == 0 && _cachedReserveB == 0) {
            (amountA, amountB) = (amountADesired, amountBDesired);
        } else {
            uint256 amountBOptimal = (amountADesired * _cachedReserveB) / _cachedReserveA;
            if (amountBOptimal <= amountBDesired) {
                require(amountBOptimal >= amountBMin, "Insufficient B amount");
                (amountA, amountB) = (amountADesired, amountBOptimal);
            } else {
                uint256 amountAOptimal = (amountBDesired * _cachedReserveA) / _cachedReserveB;
                require(amountAOptimal <= amountADesired && amountAOptimal >= amountAMin, "Insufficient A amount");
                (amountA, amountB) = (amountAOptimal, amountBDesired);
            }
        }
    }
    
    /**
     * @notice Calculates the square root of a number using Babylonian method
     * @param y Input number
     * @return z Square root of y
     */
    function _sqrt(uint256 y) internal pure returns (uint256 z) {
        if (y > 3) {
            z = y;
            uint256 x = y / 2 + 1;
            while (x < z) {
                z = x;
                x = (y / x + x) / 2;
            }
        } else if (y != 0) {
            z = 1;
        }
    }
    
    /**
     * @notice Returns the smaller of two numbers
     * @param a First number
     * @param b Second number
     * @return The smaller number
     */
    function _min(uint256 a, uint256 b) internal pure returns (uint256) {
        return a < b ? a : b;
    }
} 