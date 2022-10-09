import mongoose from "mongoose";
const Schema = mongoose.Schema;

// Basic Schema
const BasicSchema = new Schema({
    address: {
        type: String,
        default: "",
    },
    type: {
        type: Boolean,
        default: true
    }
});

export default mongoose.model("permit", BasicSchema);