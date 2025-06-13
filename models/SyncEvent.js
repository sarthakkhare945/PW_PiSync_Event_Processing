const mongoose = require("mongoose");

const syncEventSchema = new mongoose.Schema({
  device_id: { type: String, required: true },
  timestamp: { type: Date, required: true },
  total_files_synced: { type: Number, default: 0 },
  total_errors: { type: Number, default: 0 },
  internet_speed: { type: Number, default: 0 }
});

module.exports = mongoose.model("SyncEvent", syncEventSchema);
