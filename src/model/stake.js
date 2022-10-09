import mongoose from "mongoose";
const Schema = mongoose.Schema;

// Basic Schema
const BasicSchema = new Schema({
    ownerWallet: {
        type: String,
        default: "",
    },
    mint: {
        type: [{
            mint: String,
            stakeTime: Date
        }],
        default: [{
            mint: "",
            stakeTime: Date.now
        }]
    },
    stakeTime: {
        type: Date,
        default: Date.now
    }
});

export default mongoose.model("stake", BasicSchema);