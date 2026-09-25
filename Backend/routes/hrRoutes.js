const express = require('express');
const { getHrQuestion, submitHrAnswer } = require('../controllers/hrController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/question', protect, getHrQuestion);
router.post('/submit', protect, submitHrAnswer);

module.exports = router;

