const express = require('express');
const multer = require('multer');
const router = express.Router();
const carController = require('../controllers/carController');

const uploadMemory = multer({ storage: multer.memoryStorage() });

router.get('/cars', carController.getCars);
router.get('/subscribers', carController.getSubscribers);
router.post('/subscribers', carController.createSubscriber);
router.delete('/subscribers/:id', carController.deleteSubscriber);
router.post('/devices/sync-subscribers', carController.syncSubscribersToDevices);
router.post('/subscribers/import', uploadMemory.single('file'), carController.importSubscribers);
router.post('/manual-entry', carController.manualEntry);

module.exports = router;
