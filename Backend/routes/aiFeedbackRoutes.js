const express = require('express');
const { getAiFeedback } = require('../controllers/aiFeedbackController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/', protect, getAiFeedback);

module.exports = router;
