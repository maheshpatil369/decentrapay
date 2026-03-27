const Transaction  = require("../models/Transaction");
const FraudService = require("../services/fraudService");
const { ethers }   = require("ethers");

/**
 * Transaction Controller
 * Handles logging, querying, and enriching blockchain transactions
 */

/**
 * POST /api/transactions
 * Log a new transaction (called after on-chain tx is submitted/confirmed)
 */
exports.logTransaction = async (req, res) => {
  try {
    const {
      txHash, from, to, amount, amountEth, fee,
      gasUsed, gasPrice, network, chainId,
      status, type, note, blockNumber, contractTxId,
      onChainTimestamp,
    } = req.body;

    // Validate required fields
    if (!txHash || !from || !to || !amount) {
      return res.status(400).json({ error: "txHash, from, to, amount are required" });
    }

    // Normalize addresses
    const fromAddr = from.toLowerCase();
    const toAddr   = to.toLowerCase();

    // Run fraud analysis
    const fraudResult = await FraudService.analyzeTransaction({
      txHash, from: fromAddr, to: toAddr, amountEth: parseFloat(amountEth || 0),
      network, timestamp: new Date(),
    });

    // Upsert transaction (in case it's already pending and being confirmed)
    const tx = await Transaction.findOneAndUpdate(
      { txHash: txHash.toLowerCase() },
      {
        txHash:           txHash.toLowerCase(),
        blockNumber:      blockNumber || null,
        contractTxId:     contractTxId || null,
        from:             fromAddr,
        to:               toAddr,
        amount:           amount.toString(),
        amountEth:        parseFloat(amountEth || 0),
        fee:              (fee || "0").toString(),
        gasUsed:          (gasUsed || "0").toString(),
        gasPrice:         (gasPrice || "0").toString(),
        network:          network || "localhost",
        chainId:          chainId || 31337,
        status:           status || "pending",
        type:             type || "direct",
        note:             note || "",
        onChainTimestamp: onChainTimestamp ? new Date(onChainTimestamp * 1000) : null,
        fraudScore:       fraudResult.score,
        fraudFlags:       fraudResult.flags,
        isFlagged:        fraudResult.score > 70,
      },
      { upsert: true, new: true, runValidators: true }
    );

    // Emit real-time update via WebSocket
    if (req.io) {
      req.io.to(`wallet:${fromAddr}`).emit("txUpdate", tx);
      req.io.to(`wallet:${toAddr}`).emit("txUpdate", tx);
    }

    res.status(201).json({ success: true, transaction: tx });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ error: "Transaction already logged" });
    }
    console.error("logTransaction error:", err);
    res.status(500).json({ error: "Failed to log transaction" });
  }
};

/**
 * GET /api/transactions/:address
 * Get all transactions for a wallet address (sent + received)
 */
exports.getTransactions = async (req, res) => {
  try {
    const { address } = req.params;
    const {
      page    = 1,
      limit   = 20,
      status,
      type,
      sort    = "-createdAt",
      network,
    } = req.query;

    const addr  = address.toLowerCase();
    const skip  = (parseInt(page) - 1) * parseInt(limit);
    const query = {
      $or: [{ from: addr }, { to: addr }],
    };

    if (status)  query.status  = status;
    if (type)    query.type    = type;
    if (network) query.network = network;

    const [transactions, total] = await Promise.all([
      Transaction.find(query)
        .sort(sort)
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      Transaction.countDocuments(query),
    ]);

    res.json({
      transactions,
      pagination: {
        page:       parseInt(page),
        limit:      parseInt(limit),
        total,
        totalPages: Math.ceil(total / parseInt(limit)),
        hasMore:    parseInt(page) * parseInt(limit) < total,
      },
    });
  } catch (err) {
    console.error("getTransactions error:", err);
    res.status(500).json({ error: "Failed to fetch transactions" });
  }
};

/**
 * GET /api/transactions/hash/:txHash
 * Get single transaction by hash
 */
exports.getTransactionByHash = async (req, res) => {
  try {
    const tx = await Transaction.findOne({
      txHash: req.params.txHash.toLowerCase(),
    }).lean();

    if (!tx) return res.status(404).json({ error: "Transaction not found" });
    res.json(tx);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch transaction" });
  }
};

/**
 * PATCH /api/transactions/:txHash/status
 * Update transaction status (pending → confirmed/failed)
 */
exports.updateTransactionStatus = async (req, res) => {
  try {
    const { status, blockNumber } = req.body;
    const valid = ["pending", "confirmed", "failed", "refunded"];
    if (!valid.includes(status)) {
      return res.status(400).json({ error: "Invalid status" });
    }

    const tx = await Transaction.findOneAndUpdate(
      { txHash: req.params.txHash.toLowerCase() },
      { status, ...(blockNumber && { blockNumber }) },
      { new: true }
    );

    if (!tx) return res.status(404).json({ error: "Transaction not found" });

    if (req.io) {
      req.io.to(`wallet:${tx.from}`).emit("txStatusUpdate", { txHash: tx.txHash, status });
      req.io.to(`wallet:${tx.to}`).emit("txStatusUpdate",   { txHash: tx.txHash, status });
    }

    res.json({ success: true, transaction: tx });
  } catch (err) {
    res.status(500).json({ error: "Failed to update transaction status" });
  }
};

/**
 * GET /api/transactions/analytics/:address
 * Analytics data for dashboard charts
 */
exports.getAnalytics = async (req, res) => {
  try {
    const addr    = req.params.address.toLowerCase();
    const { days = 30, network } = req.query;
    const since   = new Date(Date.now() - parseInt(days) * 24 * 60 * 60 * 1000);

    const matchBase = {
      $or:       [{ from: addr }, { to: addr }],
      status:    "confirmed",
      createdAt: { $gte: since },
      ...(network && { network }),
    };

    const [
      volumeByDay,
      stats,
      topCounterparts,
      typeBreakdown,
    ] = await Promise.all([
      // Daily volume chart
      Transaction.aggregate([
        { $match: matchBase },
        {
          $group: {
            _id: {
              date: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
              direction: {
                $cond: [{ $eq: ["$from", addr] }, "sent", "received"],
              },
            },
            volume: { $sum: "$amountEth" },
            count:  { $sum: 1 },
          },
        },
        { $sort: { "_id.date": 1 } },
      ]),

      // Overall stats
      Transaction.getStatsForAddress(addr),

      // Top counterparts
      Transaction.aggregate([
        { $match: { ...matchBase, from: addr } },
        { $group: { _id: "$to", total: { $sum: "$amountEth" }, count: { $sum: 1 } } },
        { $sort: { total: -1 } },
        { $limit: 5 },
      ]),

      // Transaction type breakdown
      Transaction.aggregate([
        { $match: matchBase },
        { $group: { _id: "$type", count: { $sum: 1 }, volume: { $sum: "$amountEth" } } },
      ]),
    ]);

    res.json({
      volumeByDay,
      stats,
      topCounterparts,
      typeBreakdown,
      period: { days: parseInt(days), since },
    });
  } catch (err) {
    console.error("getAnalytics error:", err);
    res.status(500).json({ error: "Failed to fetch analytics" });
  }
};
