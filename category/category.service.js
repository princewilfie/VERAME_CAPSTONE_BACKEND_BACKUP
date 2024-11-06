const db = require('_helpers/db'); // Adjust based on project structure

module.exports = {
    create,
    getAll,
    getById,
    update,
    delete: _delete,
};

async function create(params) {
    if (await db.Category.findOne({ where: { Category_Name: params.Category_Name } })) {
        throw 'Category name already exists';
    }
    const category = new db.Category(params);
    await category.save();
    return category;
}

async function getAll() {
    return await db.Category.findAll();
}

async function getById(id) {
    const category = await db.Category.findByPk(id);
    if (!category) throw 'Category not found';
    return category;
}

async function update(id, params) {
    const category = await getById(id);
    Object.assign(category, params);
    await category.save();
    return category;
}

async function _delete(id) {
    const category = await getById(id);
    await category.destroy();
}