import mongoose from "mongoose";
const Schema = mongoose.Schema;

// Basic Schema
const BasicSchema = new Schema({
    ownerWallet: {
        type: String,
        default: "",
    },
    count: {
        type: Number,
        default: 0,
    },
});

export default mongoose.model("reroll", BasicSchema);