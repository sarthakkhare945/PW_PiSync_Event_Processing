const SyncEvent = require("../models/SyncEvent");
const moment = require("moment");

// Store failure counts per device in-memory for lightweight notification
const failureTracker = {};

exports.postSyncEvent = async (req, res) => {
  try {
    const {
      device_id,
      timestamp,
      total_files_synced,
      total_errors,
      internet_speed
    } = req.body;

    if (!device_id || !timestamp) {
      return res.status(400).json({ message: "device_id and timestamp are required." });
    }

    const parsedDate = moment(timestamp, "DD/MM/YY", true);
    if (!parsedDate.isValid()) {
      return res.status(400).json({ message: "Invalid timestamp format. Use DD/MM/YY" });
    }

    const event = new SyncEvent({
      device_id,
      timestamp: parsedDate.toDate(),
      total_files_synced: Number(total_files_synced) || 0,
      total_errors: Number(total_errors) || 0,
      internet_speed: Number(internet_speed) || 0
    });

    await event.save();

    // Notification: track 3 continuous failures
    if (!failureTracker[device_id]) failureTracker[device_id] = 0;
    if (event.total_errors > 0) {
      failureTracker[device_id]++;
      if (failureTracker[device_id] === 3) {
        console.log(`⚠️ ALERT: Device ${device_id} failed to sync 3 times in a row!`);
      }
    } else {
      failureTracker[device_id] = 0; // Reset on success
    }

    res.status(201).json({ message: "Sync event saved successfully." });

  } catch (err) {
    console.error("❌ Error saving sync event:", err);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

exports.getDeviceSyncHistory = async (req, res) => {
  try {
    const { id } = req.params;
    const events = await SyncEvent.find({ device_id: id }).sort({ timestamp: -1 });

    // Format timestamp as DD/MM/YY in response
    const formatted = events.map(e => ({
      ...e._doc,
      timestamp: moment(e.timestamp).format("DD/MM/YY")
    }));

    res.json(formatted);
  } catch (err) {
    console.error("Error fetching sync history:", err);
    res.status(500).json({ message: "Server error." });
  }
};

exports.getDevicesWithFailures = async (req, res) => {
  try {
    const result = await SyncEvent.aggregate([
      {
        $group: {
          _id: "$device_id",
          syncCount: { $sum: 1 },
          latestSync: { $last: "$$ROOT" } // get latest document for that device
        }
      },
      {
        $match: {
          syncCount: { $gt: 3 }
        }
      },
      {
        $project: {
          _id: 0,
          device_id: "$_id",
          syncCount: 1,
          timestamp: "$latestSync.timestamp",
          total_files_synced: "$latestSync.total_files_synced",
          total_errors: "$latestSync.total_errors",
          internet_speed: "$latestSync.internet_speed"
        }
      }
    ]);

    res.status(200).json(result);
  } catch (err) {
    console.error("Error fetching devices with >3 syncs:", err);
    res.status(500).json({ message: "Server error." });
  }
};


