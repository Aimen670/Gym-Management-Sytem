const express = require('express');
const router = express.Router();
const { getAvatarByMemberId, getAvatarProgress, getAllAvatarLevels, updateAvatarManually } = require('../controllers/avatarController');

// Get avatar data for a specific member
router.get('/member/:memberId/avatar', getAvatarByMemberId);

// Get avatar progress history for a member
router.get('/member/:memberId/avatar/progress', getAvatarProgress);

// Get all avatar levels
router.get('/avatar/levels', getAllAvatarLevels);

// Manual avatar update (for testing/admin)
router.post('/member/:memberId/avatar/update', updateAvatarManually);

module.exports = router;
