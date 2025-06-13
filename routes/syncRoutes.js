const express = require("express");
const multer = require("multer");
const router = express.Router();
const syncController = require("../controllers/syncController");

const upload = multer(); // No storage config needed for simple form fields

router.post("/sync-event", upload.none(), syncController.postSyncEvent); // Accept form-data
router.get("/device/:id/sync-history", syncController.getDeviceSyncHistory);
router.get("/devices/repeated-failures", syncController.getDevicesWithFailures);

module.exports = router;
