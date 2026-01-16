const express = require('express');
const router = express.Router();
const { protect, isAdmin } = require('../middleware/authMiddleware');

const todoController = require('../controller/todoController');
router.get('/', protect, todoController.getAllTasks);

router.delete('/:id', protect, isAdmin, todoController.deleteTask);

module.exports = router;