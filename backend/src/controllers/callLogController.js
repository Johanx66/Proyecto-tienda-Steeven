const CallLog = require('../models/CallLog');

async function list(req, res, next) {
  try {
    const logs = await CallLog.findAll();
    res.json(logs);
  } catch (err) {
    next(err);
  }
}

module.exports = { list };
