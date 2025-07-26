const express = require('express');
const roomController = require('../controllers/roomController');
const { requireAuth, requireRole } = require('../middleware/auth');
const router = express.Router();

router.post('/', roomController.createRoom);
router.get('/:code', roomController.getByRoomCode);
router.post('/:code/question', roomController.createQuestion);
router.get('/:code/question', roomController.getQuestions);
router.get('/:code/top-questions', roomController.generateTopQuestions);
router.delete('/:code/question/:questionId', requireAuth, requireRole(['host','admin']), roomController.deleteQuestion);

module.exports = router;