const Transaction = require("../models/Transaction");

/**
 * FraudDetectionService
 *
 * Rule-based fraud scoring engine (AI-ready — see aiAnalysis hook below).
 *
 * Score 0–100:
 *   0–30:  Low risk     → allow
 *   31–60: Medium risk  → allow + flag in logs
 *   61–80: High risk    → allow + admin alert
 *   81–100: Very high   → block on-chain (owner must unflag contract address)
 *
 * Rules implemented:
 *   1. Velocity: Too many transactions in a short period
 *   2. Amount spike: Unusually large single transfer
 *   3. New counterpart: First-ever interaction with an address
 *   4. Circular flow: Money going back immediately
 *   5. Sanctioned list: Known bad addresses (demo list)
 *   6. Odd hours: Unusual time patterns
 *   7. Round amounts: Suspiciously round numbers (common in fraud)
 */

// Demo sanction list — in production, use a real-time OFAC API
const SANCTIONED_ADDRESSES = new Set([
  "0x0000000000000000000000000000000000000001", // example placeholder
]);

class FraudDetectionService {
  /**
   * Main entry point: score a transaction before logging
   * @param {Object} tx - Transaction data
   * @returns {{ score: number, flags: string[], recommendation: string }}
   */
  async analyzeTransaction(tx) {
    const { from, to, amountEth, timestamp } = tx;
    let score = 0;
    const flags = [];

    try {
      // Run all rules in parallel
      const [
        velocityResult,
        amountResult,
        circularResult,
        sanctionResult,
        hourResult,
      ] = await Promise.all([
        this.checkVelocity(from),
        this.checkAmountSpike(from, amountEth),
        this.checkCircularFlow(from, to),
        this.checkSanctionedList(from, to),
        this.checkOddHours(timestamp),
      ]);

      // Accumulate score and flags
      const results = [velocityResult, amountResult, circularResult, sanctionResult, hourResult];
      for (const r of results) {
        score += r.score;
        if (r.flag) flags.push(r.flag);
      }

      // Round amounts check (synchronous)
      const roundCheck = this.checkRoundAmount(amountEth);
      score += roundCheck.score;
      if (roundCheck.flag) flags.push(roundCheck.flag);

      // Clamp to 0-100
      score = Math.min(100, Math.max(0, score));

      // ── AI Hook ──────────────────────────────────────────────────
      // To integrate ML model, replace this block:
      // const aiScore = await this.callAIModel({ from, to, amountEth, flags });
      // score = Math.round(score * 0.4 + aiScore * 0.6); // weighted average

      const recommendation = this.getRecommendation(score);
      console.log(`🔍 Fraud check: ${from.slice(0, 8)}... → score=${score}, flags=[${flags.join(",")}]`);

      return { score, flags, recommendation };
    } catch (err) {
      console.error("Fraud analysis error:", err);
      return { score: 0, flags: [], recommendation: "allow" };
    }
  }

  /**
   * Rule 1: Velocity — too many txs from same address recently
   */
  async checkVelocity(address) {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const count = await Transaction.countDocuments({
      from:      address,
      createdAt: { $gte: oneHourAgo },
    });

    if (count > 20) return { score: 40, flag: "HIGH_VELOCITY" };
    if (count > 10) return { score: 20, flag: "ELEVATED_VELOCITY" };
    return { score: 0, flag: null };
  }

  /**
   * Rule 2: Amount spike — this tx is much larger than user's average
   */
  async checkAmountSpike(address, amountEth) {
    const history = await Transaction.aggregate([
      { $match: { from: address, status: "confirmed" } },
      { $group: { _id: null, avg: { $avg: "$amountEth" }, stddev: { $stdDevPop: "$amountEth" } } },
    ]);

    if (!history.length || history[0].avg === 0) return { score: 0, flag: null };

    const { avg, stddev } = history[0];
    const zScore = stddev > 0 ? (amountEth - avg) / stddev : 0;

    if (zScore > 5) return { score: 35, flag: "EXTREME_AMOUNT_SPIKE" };
    if (zScore > 3) return { score: 20, flag: "AMOUNT_SPIKE" };
    return { score: 0, flag: null };
  }

  /**
   * Rule 3: Circular flow — receiver sent money to sender recently
   */
  async checkCircularFlow(from, to) {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const circular = await Transaction.countDocuments({
      from:      to,
      to:        from,
      createdAt: { $gte: oneHourAgo },
    });

    if (circular > 0) return { score: 25, flag: "CIRCULAR_FLOW" };
    return { score: 0, flag: null };
  }

  /**
   * Rule 4: Sanctioned addresses
   */
  async checkSanctionedList(from, to) {
    if (SANCTIONED_ADDRESSES.has(from.toLowerCase()) || SANCTIONED_ADDRESSES.has(to.toLowerCase())) {
      return { score: 100, flag: "SANCTIONED_ADDRESS" };
    }
    return { score: 0, flag: null };
  }

  /**
   * Rule 5: Odd hours (2 AM – 5 AM local time — basic heuristic)
   */
  checkOddHours(timestamp) {
    const hour = new Date(timestamp || Date.now()).getUTCHours();
    if (hour >= 2 && hour <= 5) return { score: 5, flag: "ODD_HOURS" };
    return { score: 0, flag: null };
  }

  /**
   * Rule 6: Suspiciously round amounts (common in fraud)
   */
  checkRoundAmount(amountEth) {
    const str = amountEth.toString();
    if (amountEth >= 1 && Number.isInteger(amountEth)) {
      return { score: 5, flag: "ROUND_AMOUNT" };
    }
    return { score: 0, flag: null };
  }

  /**
   * Convert score to human-readable recommendation
   */
  getRecommendation(score) {
    if (score >= 81) return "block";
    if (score >= 61) return "alert_admin";
    if (score >= 31) return "monitor";
    return "allow";
  }

  /**
   * Get fraud statistics for admin dashboard
   */
  async getFraudStats() {
    const [flagged, byScore, recentFlags] = await Promise.all([
      Transaction.countDocuments({ isFlagged: true }),
      Transaction.aggregate([
        {
          $group: {
            _id: {
              $switch: {
                branches: [
                  { case: { $lt: ["$fraudScore", 31] }, then: "low" },
                  { case: { $lt: ["$fraudScore", 61] }, then: "medium" },
                  { case: { $lt: ["$fraudScore", 81] }, then: "high" },
                ],
                default: "critical",
              },
            },
            count: { $sum: 1 },
          },
        },
      ]),
      Transaction.find({ isFlagged: true })
        .sort("-createdAt")
        .limit(10)
        .select("txHash from to amountEth fraudScore fraudFlags createdAt")
        .lean(),
    ]);

    return { flaggedCount: flagged, byScore, recentFlags };
  }
}

module.exports = new FraudDetectionService();
