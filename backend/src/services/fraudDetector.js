const Transaction = require("../models/Transaction");

/**
 * FraudDetector — rule-based layer that flags suspicious activity.
 *
 * Rules (extensible):
 *  1. Large single transaction (> 5 ETH on testnet)
 *  2. High velocity (> 10 transactions in the last 60 seconds)
 *  3. Rapid repeat transfers to the same address (> 5 in 30 seconds)
 *
 * Each rule returns { flagged: bool, reason: string }.
 * Replace / augment with an ML model in production.
 */

const LARGE_TX_THRESHOLD_ETH = 5;
const VELOCITY_WINDOW_SEC    = 60;
const VELOCITY_MAX_TX        = 10;
const REPEAT_WINDOW_SEC      = 30;
const REPEAT_MAX_TX          = 5;

async function analyseTransaction({ from, to, amountEth }) {
  const flags = [];

  // Rule 1: large single transfer
  if (parseFloat(amountEth) > LARGE_TX_THRESHOLD_ETH) {
    flags.push(`Large transfer: ${amountEth} ETH exceeds threshold of ${LARGE_TX_THRESHOLD_ETH} ETH`);
  }

  // Rule 2: velocity check
  const velocityWindow = new Date(Date.now() - VELOCITY_WINDOW_SEC * 1000);
  const recentCount = await Transaction.countDocuments({
    from,
    createdAt: { $gte: velocityWindow },
  });
  if (recentCount >= VELOCITY_MAX_TX) {
    flags.push(`High velocity: ${recentCount} transactions in the last ${VELOCITY_WINDOW_SEC}s`);
  }

  // Rule 3: rapid repeats to same address
  const repeatWindow = new Date(Date.now() - REPEAT_WINDOW_SEC * 1000);
  const repeatCount = await Transaction.countDocuments({
    from,
    to,
    createdAt: { $gte: repeatWindow },
  });
  if (repeatCount >= REPEAT_MAX_TX) {
    flags.push(`Rapid repeat: ${repeatCount} transfers to same address in ${REPEAT_WINDOW_SEC}s`);
  }

  return {
    flagged:   flags.length > 0,
    flagReason: flags.join("; "),
  };
}

module.exports = { analyseTransaction };
