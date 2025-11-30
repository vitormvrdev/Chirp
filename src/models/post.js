const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const PostSchema = new Schema({
    content: { 
        type: String, 
        trim: true 
    },
    // Referência ao User que criou o post
    postedBy: { 
        type: Schema.Types.ObjectId, 
        ref: 'User' 
    },
    pinned: {
        type: Boolean,
        default: false
    },
    // Array de Users que deram like neste post específico
    likes: [{ 
        type: Schema.Types.ObjectId, 
        ref: 'User' 
    }],
    // Opcional: Para teres imagens nos posts no futuro
    imageUrl: {
        type: String
    }
}, { timestamps: true });

module.exports = mongoose.model('Post', PostSchema);