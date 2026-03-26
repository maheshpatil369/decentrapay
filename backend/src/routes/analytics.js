const express     = require("express");
const Transaction = require("../models/Transaction");
const requireAuth = require("../middleware/auth");

const router = express.Router();

/**
 * GET /api/analytics/summary/:address
 * Returns aggregated stats for the analytics dashboard.
 */
router.get("/summary/:address", requireAuth, async (req, res) => {
  try {
    const address = req.params.address.toLowerCase();

    const [sentAgg, receivedAgg, recentTxs] = await Promise.all([
      // Total volume sent
      Transaction.aggregate([
        { $match: { from: address } },
        { $group: { _id: null, total: { $sum: { $toDouble: "$amount" } }, count: { $sum: 1 } } },
      ]),
      // Total volume received
      Transaction.aggregate([
        { $match: { to: address } },
        { $group: { _id: null, total: { $sum: { $toDouble: "$amount" } }, count: { $sum: 1 } } },
      ]),
      // Last 5 transactions
      Transaction.find({ $or: [{ from: address }, { to: address }] })
        .sort({ createdAt: -1 })
        .limit(5),
    ]);

    res.json({
      totalSentEth:     (sentAgg[0]?.total     || 0).toFixed(6),
      totalReceivedEth: (receivedAgg[0]?.total  || 0).toFixed(6),
      txCountSent:       sentAgg[0]?.count     || 0,
      txCountReceived:   receivedAgg[0]?.count || 0,
      recentTxs,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/analytics/volume/:address?days=30
 * Returns daily ETH volume for the last N days — used for line charts.
 */
router.get("/volume/:address", requireAuth, async (req, res) => {
  try {
    const address = req.params.address.toLowerCase();
    const days    = Math.min(parseInt(req.query.days) || 30, 365);
    const since   = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const data = await Transaction.aggregate([
      {
        $match: {
          $or: [{ from: address }, { to: address }],
          createdAt: { $gte: since },
        },
      },
      {
        $group: {
          _id: {
            date: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
            direction: {
              $cond: [{ $eq: ["$from", address] }, "sent", "received"],
            },
          },
          volume: { $sum: { $toDouble: "$amount" } },
          count:  { $sum: 1 },
        },
      },
      { $sort: { "_id.date": 1 } },
    ]);

    res.json({ days, data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/analytics/flagged
 * Returns flagged (suspicious) transactions — admin use.
 */
router.get("/flagged", requireAuth, async (req, res) => {
  try {
    const flagged = await Transaction.find({ flagged: true })
      .sort({ createdAt: -1 })
      .limit(50);
    res.json({ flagged });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
