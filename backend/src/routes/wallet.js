const express    = require("express");
const { ethers } = require("ethers");
const requireAuth = require("../middleware/auth");

const router = express.Router();

// RPC provider (read-only, no private key on server)
const getProvider = () =>
  new ethers.JsonRpcProvider(process.env.SEPOLIA_RPC_URL);

/**
 * POST /api/wallet/generate
 * Creates a fresh Ethereum wallet (public + private key).
 *
 * ⚠️  SECURITY NOTE: In production, wallets should ONLY be generated
 * client-side. This endpoint is provided for demo/hackathon purposes.
 * The private key returned here is NEVER stored on the server.
 */
router.post("/generate", (req, res) => {
  try {
    const wallet = ethers.Wallet.createRandom();
    // Return the key ONCE — it is the client's responsibility to store it safely
    res.json({
      address:    wallet.address,
      privateKey: wallet.privateKey,
      mnemonic:   wallet.mnemonic?.phrase || null,
      warning:    "Store your private key securely. It will not be shown again.",
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/wallet/balance/:address
 * Returns live ETH balance from the RPC node.
 */
router.get("/balance/:address", async (req, res) => {
  try {
    const { address } = req.params;
    if (!ethers.isAddress(address)) {
      return res.status(400).json({ error: "Invalid address" });
    }

    const provider = getProvider();
    const raw      = await provider.getBalance(address);
    res.json({
      address,
      balanceWei: raw.toString(),
      balanceEth: ethers.formatEther(raw),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/wallet/stats/:address
 * Returns on-chain stats from the DecentraPay contract.
 */
router.get("/stats/:address", async (req, res) => {
  try {
    const { address } = req.params;
    if (!ethers.isAddress(address)) {
      return res.status(400).json({ error: "Invalid address" });
    }

    const provider = getProvider();
    const abi = [
      "function walletStats(address) view returns (uint256 sent, uint256 received, uint256 count)",
    ];
    const contract = new ethers.Contract(
      process.env.CONTRACT_ADDRESS,
      abi,
      provider
    );

    const [sent, received, count] = await contract.walletStats(address);
    res.json({
      address,
      totalSentEth:     ethers.formatEther(sent),
      totalReceivedEth: ethers.formatEther(received),
      txCount:          count.toString(),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
