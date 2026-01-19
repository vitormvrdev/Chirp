const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const PostSchema = new Schema({
    content: { 
        type: String, 
        trim: true 
    },
    postedBy: { 
        type: Schema.Types.ObjectId, 
        ref: 'User' 
    },
    pinned: {
        type: Boolean,
        default: false
    },
    // Array de Users que deram like
    likes: [{ 
        type: Schema.Types.ObjectId, 
        ref: 'User' 
    }], // Se quiseres garantir, podes por default: [] aqui, mas o Mongoose costuma lidar bem
    
    retweetUsers: [{ 
        type: Schema.Types.ObjectId,
        ref: 'User'
    }],
    
    retweetData: {
        type: Schema.Types.ObjectId,
        ref: 'Post'
    },
    
    imageUrl: {
        type: String
    }
}, { timestamps: true });

module.exports = mongoose.model('Post', PostSchema);