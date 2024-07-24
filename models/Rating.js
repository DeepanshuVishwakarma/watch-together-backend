const mongoose = require('mongoose');

const RatingSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    rating: {
        type: Number,
        min: 0,
        max: 5,
        required: true,
    }
});

const Rating = mongoose.model('Rating', RatingSchema);

module.exports = Rating;
