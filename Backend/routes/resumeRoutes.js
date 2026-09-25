const express = require('express');
const {
  analyzeResume,
  reanalyzeExistingResume,
  getLatestAnalysis,
  getAnalysisHistory,
  getAnalysisById,
  deleteAnalysis,
} = require('../controllers/resumeAnalysisController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/analyze', protect, analyzeResume);
router.post('/reanalyze', protect, reanalyzeExistingResume);
router.get('/latest', protect, getLatestAnalysis);
router.get('/history', protect, getAnalysisHistory);
router.get('/:id', protect, getAnalysisById);
router.delete('/:id', protect, deleteAnalysis);

module.exports = router;
