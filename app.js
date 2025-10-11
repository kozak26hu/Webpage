// Initialize ethers.js provider with fallback to MetaMask if available
const provider = window.ethereum 
    ? new ethers.BrowserProvider(window.ethereum) 
    : new ethers.JsonRpcProvider('https://eth.llamarpc.com');

// Contract addresses (checksummed)
const PHANDS_ADDRESS = ethers.getAddress('0x11157Da1fC6dCfd58b50ed79082183b2c6176245');
const WETH_ADDRESS = ethers.getAddress('0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2');
const UNISWAP_V3_FACTORY = ethers.getAddress('0x1F98431c8aD98523631AE4a59f267346ea31F984');
const BALANCER_V2_VAULT = ethers.getAddress('0xBA12222222228d8Ba445958a75a0704d566BF2C8'); // For V2/V3 compatibility
const UNISWAP_V2_FACTORY = ethers.getAddress('0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f');

// Balancer V3 Pool ID (from your link)
const BALANCER_POOL_ID = '0xe36b198c43ddbec2d25c4f0a0bc5b80330551009';

// ABIs
const UNISWAP_V3_POOL_ABI = [
    'function slot0() view returns (uint160 sqrtPriceX96, int24 tick, uint16 observationIndex, uint16 observationCardinality, uint16 observationCardinalityNext, uint8 feeTier, bool unlocked)',
    'function token0() view returns (address)',
    'function token1() view returns (address)'
];
const BALANCER_VAULT_ABI = [
    'function getPoolTokens(bytes32 poolId) view returns (address[] tokens, uint256[] balances, uint256 lastChangeBlock)'
];
const UNISWAP_V3_FACTORY_ABI = [
    'function getPool(address tokenA, address tokenB, uint24 fee) view returns (address pool)'
];
const UNISWAP_V2_FACTORY_ABI = [
    'function getPair(address tokenA, address tokenB) view returns (address pair)'
];
const UNISWAP_V2_PAIR_ABI = [
    'function getReserves() view returns (uint112 reserve0, uint112 reserve1, uint32 blockTimestampLast)',
    'function token0() view returns (address)',
    'function token1() view returns (address)'
];

async function getETHUSDPrice() {
    try {
        const response = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd');
        const data = await response.json();
        return data.ethereum.usd || 2600;
    } catch {
        console.log('ETH/USD fetch failed; using fallback price');
        return 2600;
    }
}

async function getUniswapV3Price() {
    try {
        const factory = new ethers.Contract(UNISWAP_V3_FACTORY, UNISWAP_V3_FACTORY_ABI, provider);
        const feeTiers = [500, 3000, 10000];
        let poolAddress = ethers.ZeroAddress;
        for (const fee of feeTiers) {
            try {
                poolAddress = await factory.getPool(PHANDS_ADDRESS, WETH_ADDRESS, fee);
                if (poolAddress !== ethers.ZeroAddress) break;
            } catch (callError) {
                continue;
            }
        }
        if (poolAddress === ethers.ZeroAddress) {
            console.log('No Uniswap V3 pool for PHANDS/WETH');
            return null;
        }

        const pool = new ethers.Contract(poolAddress, UNISWAP_V3_POOL_ABI, provider);
        const slot0 = await pool.slot0();
        const token0 = await pool.token0();
        const sqrtPriceX96 = slot0.sqrtPriceX96;

        const price = (BigInt(sqrtPriceX96) ** BigInt(2)) / (BigInt(2) ** BigInt(192));
        const isPHANDSFirst = token0.toLowerCase() === PHANDS_ADDRESS.toLowerCase();
        const priceInETH = isPHANDSFirst ? 1 / (Number(price) / 1e18) : Number(price) / 1e18;

        return priceInETH;
    } catch (error) {
        console.log('Uniswap V3 price fetch failed:', error.message);
        return null;
    }
}

async function getUniswapV2Price() {
    try {
        const factory = new ethers.Contract(UNISWAP_V2_FACTORY, UNISWAP_V2_FACTORY_ABI, provider);
        const pairAddress = await factory.getPair(PHANDS_ADDRESS, WETH_ADDRESS);
        if (pairAddress === ethers.ZeroAddress) {
            console.log('No Uniswap V2 pool for PHANDS/WETH');
            return null;
        }

        const pair = new ethers.Contract(pairAddress, UNISWAP_V2_PAIR_ABI, provider);
        const reserves = await pair.getReserves();
        const token0 = await pair.token0();
        let reservePHANDS, reserveWETH;
        if (token0.toLowerCase() === PHANDS_ADDRESS.toLowerCase()) {
            reservePHANDS = reserves.reserve0;
            reserveWETH = reserves.reserve1;
        } else {
            reservePHANDS = reserves.reserve1;
            reserveWETH = reserves.reserve0;
        }

        const priceInETH = Number(ethers.formatEther(reserveWETH)) / Number(ethers.formatEther(reservePHANDS));
        return priceInETH;
    } catch (error) {
        console.log('Uniswap V2 price fetch failed:', error.message);
        return null;
    }
}

async function getBalancerPrice() {
    try {
        const vault = new ethers.Contract(BALANCER_V2_VAULT, BALANCER_VAULT_ABI, provider);
        const poolTokens = await vault.getPoolTokens(BALANCER_POOL_ID);

        const phandsIndex = poolTokens.tokens.findIndex(t => t.toLowerCase() === PHANDS_ADDRESS.toLowerCase());
        const wethIndex = poolTokens.tokens.findIndex(t => t.toLowerCase() === WETH_ADDRESS.toLowerCase());

        if (phandsIndex === -1 || wethIndex === -1) {
            console.log(`Balancer pool ${BALANCER_POOL_ID} does not contain PHANDS/WETH`);
            return null;
        }

        const reservePHANDS = poolTokens.balances[phandsIndex];
        const reserveWETH = poolTokens.balances[wethIndex];

        // Check for low liquidity (e.g., < $100)
        const liquidityUSD = (Number(ethers.formatEther(reserveWETH)) * 2600) + (Number(ethers.formatEther(reservePHANDS)) * 0.023); // Approx
        if (liquidityUSD < 100) {
            console.log('Balancer pool has low liquidity; skipping price');
            return null;
        }

        const priceInETH = Number(ethers.formatEther(reserveWETH)) / Number(ethers.formatEther(reservePHANDS));
        return priceInETH;
    } catch (error) {
        console.log('Balancer price fetch failed (V3 pool may not be queryable via Vault):', error.message);
        return null;
    }
}

async function updatePrices() {
    const ethUsd = await getETHUSDPrice();
    let uniPriceETH = await getUniswapV3Price();
    if (!uniPriceETH) {
        uniPriceETH = await getUniswapV2Price(); // Fallback to V2
    }
    const balPriceETH = await getBalancerPrice();

    // Update Uniswap price
    if (uniPriceETH) {
        const uniPriceUSD = uniPriceETH * ethUsd;
        document.getElementById('uniPrice').textContent = `$${uniPriceUSD.toFixed(6)} (~${uniPriceETH.toFixed(8)} ETH)`;
        document.getElementById('currentPrice').textContent = `$${uniPriceUSD.toFixed(6)}`;
    } else {
        document.getElementById('uniPrice').textContent = 'N/A';
        document.getElementById('currentPrice').textContent = 'N/A';
    }

    // Update Balancer price
    if (balPriceETH) {
        const balPriceUSD = balPriceETH * ethUsd;
        document.getElementById('balPrice').textContent = `$${balPriceUSD.toFixed(6)} (~${balPriceETH.toFixed(8)} ETH)`;
    } else {
        document.getElementById('balPrice').textContent = 'N/A (Low Liquidity)';
    }

    // Update price difference
    if (uniPriceETH && balPriceETH) {
        const diffPercent = ((uniPriceETH - balPriceETH) / balPriceETH * 100).toFixed(2);
        document.getElementById('priceDiff').textContent = `${diffPercent}%`;
        document.getElementById('priceDiff').classList.remove('text-green-400', 'text-red-400');
        document.getElementById('priceDiff').classList.add(diffPercent >= 0 ? 'text-green-400' : 'text-red-400');
    } else {
        document.getElementById('priceDiff').textContent = 'N/A';
        document.getElementById('priceDiff').classList.remove('text-green-400', 'text-red-400');
    }
}

// Last Updated
function updateTimestamp() {
    const now = new Date();
    document.getElementById('lastUpdated').textContent = `Last Updated: ${now.toLocaleString('en-GB', { timeZone: 'CET', hour12: false })} CEST`;
}

// Run on load and every 30 seconds
updateTimestamp();
updatePrices();
setInterval(() => {
    updateTimestamp();
    updatePrices();
}, 30000);

// Wallet connect
document.getElementById('connectWallet').addEventListener('click', async () => {
    if (window.ethereum && typeof window.ethereum.request === 'function') {
        try {
            const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
            if (accounts.length > 0) alert(`Connected! Address: ${accounts[0]}`);
            else alert('No accounts found. Unlock MetaMask or add an account.');
        } catch (error) {
            if (error.code === 4001) alert('You rejected the connection.');
            else if (error.code === -32002) alert('Pending request. Approve in MetaMask.');
            else alert(`Error: ${error.message}`);
        }
    } else alert('MetaMask not detected. Please install or enable it!');
});