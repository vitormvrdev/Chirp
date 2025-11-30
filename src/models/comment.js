const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const CommentSchema = new Schema({
    content: {
        type: String,
        required: true,
        trim: true
    },
    // Quem comentou
    postedBy: {
        type: Schema.Types.ObjectId,
        ref: 'User'
    },
    // Em que post comentou
    onPost: {
        type: Schema.Types.ObjectId,
        ref: 'Post'
    },
    // Likes específicos do comentário
    likes: [{
        type: Schema.Types.ObjectId,
        ref: 'User'
    }]
}, { timestamps: true });

module.exports = mongoose.model('Comment', CommentSchema);