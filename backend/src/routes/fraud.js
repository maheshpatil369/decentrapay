const express      = require("express");
const router       = express.Router();
const FraudService = require("../services/fraudService");

router.get("/stats", async (req, res) => {
  try {
    const stats = await FraudService.getFraudStats();
    res.json(stats);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch fraud stats" });
  }
});

module.exports = router;
