import mongoose from "mongoose";
const Schema = mongoose.Schema;

// Basic Schema
const BasicSchema = new Schema({
    address: {
        type: String,
        default: ""
    },
    email: {
        type: String,
        default: ""
    },
    image_url: {
        type: String,
        default: ""
    }

});

export default mongoose.model("user", BasicSchema);