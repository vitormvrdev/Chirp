const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const NotificationSchema = new Schema({
    userTo: { type: Schema.Types.ObjectId, ref: 'User' }, // Quem recebe
    userFrom: { type: Schema.Types.ObjectId, ref: 'User' }, // Quem fez a ação
    notificationType: { type: String }, // 'postLike' ou 'retweet'
    entityId: { type: Schema.Types.ObjectId }, // O ID do Post
    opened: { type: Boolean, default: false } // Se já foi lida
}, { timestamps: true });

NotificationSchema.statics.insertNotification = async (userTo, userFrom, notificationType, entityId) => {
    var data = {
        userTo: userTo,
        userFrom: userFrom,
        notificationType: notificationType,
        entityId: entityId
    };
    // Não criar notificação para nós próprios
    if(userTo == userFrom) return;

    // Apagar notificação anterior se já existir (para não duplicar likes)
    await mongoose.model("Notification").deleteOne(data).catch(error => console.log(error));
    
    return mongoose.model("Notification").create(data).catch(error => console.log(error));
}

module.exports = mongoose.model('Notification', NotificationSchema);