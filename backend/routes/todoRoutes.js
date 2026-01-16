const express = require('express');
const router = express.Router();
const { protect, isAdmin } = require('../middleware/authMiddleware');

const todoController = require('../controller/todoController');

// Get all tasks (role-based filtering applied in controller)
router.get('/', protect, todoController.getAllTasks);

// Create task - Admin/SuperAdmin only (Members can create personal tasks)
router.post('/', protect, todoController.createTask);

// Update task - Members can update their own, Admins can update any
router.put('/:id', protect, todoController.updateTask);

// Update task status only (simplified endpoint)
router.patch('/:id/status', protect, todoController.updateTaskStatus);

// Delete task - Admin/SuperAdmin only
router.delete('/:id', protect, isAdmin, todoController.deleteTask);

module.exports = router;