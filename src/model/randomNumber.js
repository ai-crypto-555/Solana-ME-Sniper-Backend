import mongoose from "mongoose";
const Schema = mongoose.Schema;

// Basic Schema
const BasicSchema = new Schema({
    number: {
        type: Number,
        default: 0
    }
});

export default mongoose.model("randomNumber", BasicSchema);