const express = require('express');
const { handleChatbotMessage } = require('../controllers/chatbotController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/', protect, handleChatbotMessage);

module.exports = router;

