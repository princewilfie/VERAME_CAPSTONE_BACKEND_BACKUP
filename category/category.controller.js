const express = require('express');
const router = express.Router();
const categoryService = require('./category.service');
const authorize = require('_middleware/authorize'); // Adjust middleware based on your project

// Create a new category (Admin only)
router.post('/', authorize('Admin'), create);
router.get('/', getAll); // Get all categories
router.get('/:id', getById); // Get category by ID
router.put('/:id', authorize('Admin'), update); // Update category (Admin only)
router.delete('/:id', authorize('Admin'), _delete); // Delete category (Admin only)

module.exports = router;

function create(req, res, next) {
    categoryService.create(req.body)
        .then(category => res.json(category))
        .catch(next);
}

function getAll(req, res, next) {
    categoryService.getAll()
        .then(categories => res.json(categories))
        .catch(next);
}

function getById(req, res, next) {
    categoryService.getById(req.params.id)
        .then(category => res.json(category))
        .catch(next);
}

function update(req, res, next) {
    categoryService.update(req.params.id, req.body)
        .then(category => res.json(category))
        .catch(next);
}

function _delete(req, res, next) {
    categoryService.delete(req.params.id)
        .then(() => res.json({ message: 'Category deleted successfully' }))
        .catch(next);
}
