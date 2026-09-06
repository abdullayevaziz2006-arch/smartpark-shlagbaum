const express = require('express');
const multer = require('multer');
const router = express.Router();
const cameraController = require('../controllers/cameraController');

const upload = multer({ dest: 'uploads/' });

router.post('/webhook/camera', upload.any(), cameraController.handleCameraWebhook);
router.post('/webhook/heartbeat', cameraController.handleHeartbeat);
router.get('/camera/snapshot/:ip', cameraController.getCameraSnapshot);
router.get('/camera/stream/:ip', cameraController.getCameraMjpegStream);
router.post('/manual-open-camera', cameraController.manualOpenCamera);
router.post('/barrier/open', cameraController.triggerBarrierManual);

module.exports = router;
