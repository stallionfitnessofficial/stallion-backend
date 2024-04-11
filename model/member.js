const mongoose = require("mongoose");

const memberSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
        },
    email: {
        type: String,
        // required: true
        },
    num: {
        type: Number,
        required: true
        },
    iniDate: {
        type: Date,
        default: Date.now
        },
    months: {
        type: Number,
        required: true
        }
}, {timeStamps: true});
module.exports = mongoose.model("Member", memberSchema);

// export default