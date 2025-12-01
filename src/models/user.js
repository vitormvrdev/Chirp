const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const UserSchema = new Schema({
    firstName: { 
        type: String, 
        required: true, 
        trim: true 
    },
    lastName: { 
        type: String, 
        required: true, 
        trim: true 
    },
    userhandle: { 
        type: String, 
        required: true, 
        trim: true, 
        unique: true 
    },
    email: { 
        type: String, 
        required: true, 
        trim: true, 
        unique: true 
    },
    password: { 
        type: String, 
        required: true 
    },
    profilePic: { 
        type: String, 
        default: "/images/profile_pic.png" // Caminho para uma imagem padrão na pasta public
    },
    // Array com IDs dos posts que o user deu like (útil para mostrar "Posts que gostaste")
    likes: [{ 
        type: Schema.Types.ObjectId, 
        ref: 'Post' 
    }],
    // Self-reference: Users a seguir outros Users
    followers: [{ 
        type: Schema.Types.ObjectId, 
        ref: 'User' 
    }],
    following: [{ 
        type: Schema.Types.ObjectId, 
        ref: 'User' 
    }]
}, { timestamps: true }); // Cria automaticamente createdAt e updatedAt

// Verifica se mongoose.models.User já existe. Se sim, usa-o. Se não, cria.
module.exports = mongoose.models.User || mongoose.model('User', UserSchema);