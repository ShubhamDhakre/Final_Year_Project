const express = require('express');
const {
  uploadResume,
  getTechnicalQuestion,
  submitTechnicalAnswer,
} = require('../controllers/technicalController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/upload', protect, uploadResume);
router.get('/question', protect, getTechnicalQuestion);
router.post('/submit', protect, submitTechnicalAnswer);

module.exports = router;

