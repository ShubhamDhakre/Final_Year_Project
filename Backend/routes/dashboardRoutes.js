const express = require('express');
const {
  createInterviewSummary,
  getDashboardStats,
  getDashboardHistory,
} = require('../controllers/dashboardController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/summary', protect, createInterviewSummary);
router.get('/stats', protect, getDashboardStats);
router.get('/history', protect, getDashboardHistory);

module.exports = router;

