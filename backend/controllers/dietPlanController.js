const {
  getDietPlansAdmin,
  createDietPlan,
  updateDietPlan,
  deleteDietPlan
} = require('../models/dietPlanModel');

async function getDietPlansAdminHandler(req, res) {
  try {
    const plans = await getDietPlansAdmin();
    res.json(plans);
  } catch (err) {
    console.error('Diet plans fetch error:', err);
    res.status(500).json({ error: 'Failed to load diet plans' });
  }
}

async function createDietPlanHandler(req, res) {
  try {
    const created = await createDietPlan(req.body);
    res.status(201).json(created);
  } catch (err) {
    console.error('Diet plan create error:', err);
    res.status(400).json({ error: err.message || 'Failed to create diet plan' });
  }
}

async function updateDietPlanHandler(req, res) {
  try {
    const dietPlanId = parseInt(req.params.id, 10);
    if (Number.isNaN(dietPlanId)) {
      return res.status(400).json({ error: 'Invalid diet plan id' });
    }

    const updated = await updateDietPlan(dietPlanId, req.body);
    res.json(updated);
  } catch (err) {
    console.error('Diet plan update error:', err);
    const statusCode = err.message.includes('not found') ? 404 : 400;
    res.status(statusCode).json({ error: err.message || 'Failed to update diet plan' });
  }
}

async function deleteDietPlanHandler(req, res) {
  try {
    const dietPlanId = parseInt(req.params.id, 10);
    if (Number.isNaN(dietPlanId)) {
      return res.status(400).json({ error: 'Invalid diet plan id' });
    }

    await deleteDietPlan(dietPlanId);
    res.json({ success: true });
  } catch (err) {
    console.error('Diet plan delete error:', err);
    const statusCode = err.message.includes('not found') ? 404 : 400;
    res.status(statusCode).json({ error: err.message || 'Failed to delete diet plan' });
  }
}

module.exports = {
  getDietPlansAdminHandler,
  createDietPlanHandler,
  updateDietPlanHandler,
  deleteDietPlanHandler
};
