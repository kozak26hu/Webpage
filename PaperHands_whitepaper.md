

# PaperHands ($PHANDS) Whitepaper

**Version:** 1.0  
**Date:** October 09, 2025  
**Contract Address:** 0x11157Da1fC6dCfd58b50ed79082183b2c6176245 (Ethereum Mainnet)  
**Authors:** PaperHands Development Team  
**Contact:** zsoltrasp74@gmail.com | Website: paperhands.io (coming soon) | X: [@OfficialPHANDS](https://x.com/OfficialPHANDS) | Telegram: [t.me/phandsannouncement](https://t.me/phandsannouncement)  

## Table of Contents
1. [Executive Summary](#executive-summary)  
2. [Problem Statement and Market Overview](#problem-statement-and-market-overview)  
3. [Solution](#solution)  
4. [Technology](#technology)  
5. [Tokenomics](#tokenomics)  
6. [Roadmap](#roadmap)  
7. [Team](#team)  
8. [Risks and Mitigation](#risks-and-mitigation)  
9. [Legal Disclaimer](#legal-disclaimer)  
10. [References](#references)  

## Executive Summary
PaperHands ($PHANDS) is an ERC-20 token launched on October 7, 2025, at address 0x11157Da1fC6dCfd58b50ed79082183b2c6176245 on Ethereum Mainnet. Redefining the "paper hands" meme, $PHANDS offers high-yield staking (20% APY, 30-day lockup, 180-day cycle), 5% referral bonuses on user activity (e.g., swaps, minted as new tokens, max. 1,000 PHAND/referrer/tx), and 20% deposit bonuses for the first 5 liquidity providers (min. 1,000 PHAND swap, max. 200 PHAND bonus) in WETH/PHANDS pools ($319 current liquidity, targeting $5k-$50k short-term, $100k long-term). With an initial 1,000,000 $PHANDS supply (mintable for airdrops/referrals, planned to be fixed in Q2 2026 via ownership renounce), and anti-whale limits (2% max wallet, 1% max tx), the project drives adoption via airdrops (100 PHAND for the first 10 Telegram joiners). This whitepaper details the token’s mechanics, economics, and roadmap to achieve 10,000+ holders by Q3 2026. Join the diamond-hand crew: Stake, earn, grow. #PaperHands2DiamondHands 🖐️

## Problem Statement and Market Overview
Memecoins and DeFi face whale dominance, premature selling, and insufficient retail incentives. The global crypto market exceeds $2 trillion in 2025, with memecoins driving $400B+ in volume and DeFi TVL at $600B (CoinMarketCap, DeFiLlama). $PHANDS targets retail traders and meme enthusiasts seeking high returns and fair access in a volatile market.

- **Market Size:** Memecoin volume: $400B+; DeFi TVL: $600B (Q3 2025).
- **Target Audience:** Global retail investors, meme/DeFi communities in Europe, Asia, and beyond.
- **Competitive Landscape:**

| Competitor | Strength | Weakness | $PHANDS Advantage |
|------------|----------|----------|-------------------|
| SHIB       | Viral community | High inflation | Initial 1M supply, 20% APY |
| DOGE       | Brand recognition | No staking | 30-day lockup, high yields |
| PEPE       | Low entry | Whale control | Anti-whale limits (2% wallet) |

## Solution
$PHANDS transforms memecoins by offering high staking rewards (20% APY, 30-day lockup, 180-day cycle), 5% referral bonuses for user activity (e.g., swaps, minted as new tokens, max. 1,000 PHAND/referrer/tx), and 20% deposit bonuses for the first 5 liquidity providers (min. 1,000 PHAND swap, max. 200 PHAND bonus) on WETH/PHANDS pools (Uniswap: $110, Balancer: $209, targeting $5k-$50k). Anti-whale mechanics (1% max tx, 2% max wallet) ensure fairness, while airdrops (100 PHAND for the first 10 Telegram joiners) drive adoption. A dedicated staking dApp and potential long-term governance exploration (2027+) empower users to earn and participate. Minting is enabled to attract new users but planned to be deactivated in Q2 2026 via ownership renounce.

## Technology
$PHANDS is a Solidity v0.8.30 ERC-20 token using OpenZeppelin libraries (ERC20, ERC20Pausable, Ownable), deployed at 0x11157Da1fC6dCfd58b50ed79082183b2c6176245. A separate staking contract enables high-yield rewards and LP bonuses, verified on Etherscan.

- **Architecture:** ERC-20 with custom _update hooks for limits and referrals; staking contract with SafeERC20, ReentrancyGuard, Pausable.
- **Consensus:** Ethereum PoS for secure, energy-efficient operations.
- **Key Functions (Token Contract):**
  - Transfers with 1% max tx (10,000 PHAND) and 2% max wallet (20,000 PHAND, except owner).
  - Referral system: `setReferrer()` and `claimReferralBonus()` (5% bonus on user activity, e.g., swaps, minted as new tokens, max. 1,000 PHAND/referrer/tx).
  - Airdrop: Batch distribution to max. 20 addresses per call (e.g., 100 PHAND for first 10 Telegram joiners).
  - Pause/unpause for emergency control (renounceable).
- **Key Functions (Staking Contract):**
  - 30-day lockup (`LOCK_PERIOD = 30 days`).
  - 20% annual APY (`REWARD_RATE = 55`, ~0.055% daily, adjusted by stake ratio, 180-day cycle).
  - LP staking with 20% deposit bonus for WETH/PHANDS pools.
  - Auto-claim option for rewards.
- **Security:** Reentrancy protection, immutable limits, owner-controlled minting. Audit planned (Certik, Q1 2026).
- **Scalability:** Ethereum Mainnet (15 TPS); planned Layer 2 migration (e.g., Polygon, 2,000+ TPS) for lower fees and faster transactions.
- **Sample Code (Token Contract):**

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Pausable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract PaperHands is ERC20, ERC20Pausable, Ownable {
    uint256 public immutable maxTxAmt = 10000 * 10 ** 18; // 1% limit
    uint256 private immutable mwp = 200; // 2% max wallet
    uint256 private immutable rbp = 500; // Referral bonus 5%
    mapping(address => address) public referrers;

    constructor() ERC20("PaperHands", "PHANDS") Ownable(msg.sender) {
        _mint(msg.sender, 1000000 * 10 ** 18); // Initial 1M supply
    }

    function mint(address to, uint256 amt) public onlyOwner {
        _mint(to, amt);
    }

    function setReferrer(address ref) external {
        require(referrers[msg.sender] == address(0), "Ref already set");
        require(ref != msg.sender, "No self-ref");
        referrers[msg.sender] = ref;
    }

    function claimReferralBonus(address buyer, uint256 buyAmt) external onlyOwner {
        address ref = referrers[buyer];
        if (ref != address(0)) {
            uint256 bonus = (buyAmt * rbp) / 10000;
            _mint(ref, bonus);
        }
    }

    function airdrop(address[] calldata recips, uint256[] calldata amts) external onlyOwner {
        require(recips.length == amts.length && recips.length <= 20, "Array mismatch or too long");
        for (uint i = 0; i < recips.length; i++) {
            _mint(recips[i], amts[i]);
        }
    }

    function pause() public onlyOwner { _pause(); }
    function unpause() public onlyOwner { _unpause(); }

    function _update(address from, address to, uint256 amt) internal override(ERC20, ERC20Pausable) {
        if (from != address(0)) {
            require(amt <= maxTxAmt, "Exceeds tx limit");
            if (to != owner()) {
                uint256 totSup = totalSupply();
                uint256 maxWal = (totSup * mwp) / 10000;
                require(balanceOf(to) + amt <= maxWal, "Exceeds wallet limit");
            }
        }
        super._update(from, to, amt);
    }
}
```

- **Sample Code (Staking Contract, Excerpt):**

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

contract MyStaking is Ownable, ReentrancyGuard, Pausable {
    using SafeERC20 for IERC20;
    IERC20 public paperHandsToken;
    IERC20 public lpToken;
    uint256 public constant REWARD_RATE = 55; // ~20% annual APY
    uint256 public constant LOCK_PERIOD = 30 days;

    constructor(address _paperHandsToken, address _lpToken) Ownable(msg.sender) {
        paperHandsToken = IERC20(_paperHandsToken);
        lpToken = IERC20(_lpToken);
    }

    function stakePHAND(uint256 amount) external whenNotPaused nonReentrant {
        require(amount > 0, "Amount must be > 0");
        // Staking logic with 30-day lockup and 20% APY
    }

    function stakeLP(uint256 amount) external whenNotPaused nonReentrant {
        require(amount > 0, "Amount must be > 0");
        // LP staking with 20% deposit bonus
    }
}
```

- **Liquidity Pools:** 
  - Uniswap V2/V3: WETH/PHANDS pool (~$110 liquidity, under development, targeting $5k-$50k short-term, $100k long-term).
  - Balancer V3: WETH/PHANDS pool (~$209 liquidity, under development, targeting $5k-$50k short-term, $100k long-term).

## Tokenomics
- **Token Symbol:** $PHANDS
- **Total Supply:** Initial 1,000,000 $PHANDS (18 decimals, minted at deploy), with owner-controlled minting for airdrops and referral bonuses, planned to be deactivated in Q2 2026 via ownership renounce.
- **Distribution:**
  - Community/Staking/Airdrops: 50% (500,000 PHANDS: 100 PHAND airdrops for first 10 Telegram joiners, staking rewards, community promotions/swaps).
  - Liquidity Pools: 20% (200,000 PHANDS: Uniswap/Balancer, $319 current, 20% bonus for first 5 providers, min. 1,000 PHAND, max. 200 PHAND, targeting $5k-$50k).
  - Team/Reserve: 25% (250,000 PHANDS, 24-month vesting for founder).
  - Ecosystem/Marketing: 5% (50,000 PHANDS: additional airdrops, promotions, community incentives).
- **Utility:** 
  - Staking: 20% APY for 180 days, 30-day lockup, sávos kamatozás.
  - Liquidity: 20% deposit bonus for first 5 providers (min. 1,000 PHAND, max. 200 PHAND).
  - Referrals: 5% bonus on user activity (e.g., swaps, minted as new tokens, max. 1,000 PHAND/referrer/tx, owner-controlled).
  - Governance: Potential long-term governance exploration (2027+), currently centralized under founder control.
- **Mechanisms:** Anti-whale limits (1% tx, 2% wallet); no built-in burn, but community-voted deflation possible. No transaction tax (gas only).

## Roadmap
| Phase | Timeline | Milestones |
|-------|----------|------------|
| Phase 1: Launch | Q4 2025 (Oct) | Token deployed (Oct 7), Uniswap/Balancer pools ($319 liquidity, targeting $5k-$50k), staking dApp live (phands-staking-dapp.vercel.app), 100 PHAND airdrops for first 10 Telegram joiners, Telegram growth (1,000+ members). |
| Phase 2: Growth | Q1 2026 | 5,000 holders, referral program scale-up, Certik audit, X/Telegram campaigns, 20% deposit bonus campaign. |
| Phase 3: Expansion | Q2-Q3 2026 | Ownership renounce to deactivate minting (Q2), CEX listings (e.g., KuCoin), DeFi integrations (Aave/Curve), liquidity pools to $50k-$100k, 10,000+ holders. |
| Phase 4: Maturity | 2027+ | 50,000 holders, Layer 2 migration (e.g., Polygon), NFT staking or cross-chain features, potential governance exploration. |

## Team
The PaperHands project is led by a dedicated solo founder under the PaperHands Development Team, focused on high-yield DeFi and meme-driven growth.

- **AnonDev (Founder & Lead Developer)**: 2-3 years in blockchain development, specializing in ERC-20 tokens and referral/staking systems. Deployed multiple contracts on Ethereum, emphasizing fair distribution and high returns.

**Links:** X: [@OfficialPHANDS](https://x.com/OfficialPHANDS) | Telegram: [t.me/phandsannouncement](https://t.me/phandsannouncement).

## Risks and Mitigation
- **Market Risk:** Memecoin volatility – Mitigated by 20% APY and 5% referral incentives.
- **Technical Risk:** Contract bugs – OpenZeppelin libraries; Certik audit planned (Q1 2026).
- **Regulatory Risk:** EU MiCA compliance – Transparent design, legal consultation ongoing.
- **Adoption Risk:** Slow growth – Airdrops (100 PHAND for first 10 Telegram joiners) and 5% referrals for viral spread.
- **Inflation Risk:** Owner-controlled minting for referrals/airdrops (max. ~3-4% supply increase, e.g., 37,000 PHANDS for 37 referrers at 1,000 PHAND each) – Mitigated by owner-controlled limits, planned ownership renounce in Q2 2026, and potential long-term governance (2027+).

## Legal Disclaimer
This whitepaper is informational only and not financial, investment, or legal advice. $PHANDS carries risks, including total loss due to market volatility. The project aims for EU MiCA compliance (2024). No guarantees of returns. Do your own research (DYOR) and consult professionals. The team is not liable for losses.

## References
- Etherscan: https://etherscan.io/address/0x11157Da1fC6dCfd58b50ed79082183b2c6176245
- OpenZeppelin Docs: https://docs.openzeppelin.com/contracts/5.x/erc20
- Uniswap: https://app.uniswap.org/#/swap?inputCurrency=0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2&outputCurrency=0x11157Da1fC6dCfd58b50ed79082183b2c6176245
- Balancer Pool: https://balancer.fi/pools/ethereum/v3/0xe36b198c43ddbec2d25c4f0a0bc5b80330551009
- Market Data: CoinMarketCap, DeFiLlama (2025).
- Community: X (@OfficialPHANDS), Telegram (t.me/phandsannouncement).

