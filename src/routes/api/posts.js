const express = require('express');
const router = express.Router();
const Post = require('../../models/post');
const User = require('../../models/user'); 
const Notification = require('../../models/notification');

// GET /api/posts -> Busca TODOS os posts de TODA a gente
router.get("/", async (req, res, next) => {
    // Cria um objeto de busca vazio
    var searchObj = {};

    if(req.query.postedBy !== undefined) {
        searchObj.postedBy = req.query.postedBy;
    }

    try {
        // Passamos o searchObj para o find()
        let results = await Post.find(searchObj) 
            .populate("postedBy")
            .populate("retweetData")
            .sort({ "createdAt": -1 });

        results = await User.populate(results, { path: "retweetData.postedBy" });

        res.status(200).send(results);
    } catch (error) {
        console.log(error);
        res.sendStatus(400);
    }
});

router.put("/:id/like", async (req, res, next) => {
    var postId = req.params.id;
    var userId = req.session.user._id;

    // Verifica se já demos like
    var isLiked = req.session.user.likes && req.session.user.likes.includes(postId);

    var option = isLiked ? "$pull" : "$addToSet";

    // 1. Atualizar o User (adicionar/remover aos likes dele)
    req.session.user = await User.findByIdAndUpdate(userId, { [option]: { likes: postId } }, { new: true })
        .catch(error => { console.log(error); res.sendStatus(400); });

    // 2. Atualizar o Post (adicionar/remover aos likes do post)
    var post = await Post.findByIdAndUpdate(postId, { [option]: { likes: userId } }, { new: true })
        .catch(error => { console.log(error); res.sendStatus(400); });

    // 3. Criar Notificação (apenas se for Like novo)
    if (!isLiked) {
        await Notification.insertNotification(post.postedBy, userId, "postLike", post._id);
    }

    res.status(200).send(post);
});

// POST /api/posts/:id/retweet -> Dar Repost
router.post("/:id/retweet", async (req, res, next) => {
    var postId = req.params.id;
    var userId = req.session.user._id;

    // Tentar apagar o retweet se já existir (Un-retweet)
    var deletedPost = await Post.findOneAndDelete({ postedBy: userId, retweetData: postId })
        .catch(error => { console.log(error); res.sendStatus(400); });

    var option = deletedPost != null ? "$pull" : "$addToSet";

    var repost = deletedPost;

    if (repost == null) {
        // Se não existia, criamos um novo post que é um Retweet
        repost = await Post.create({ postedBy: userId, retweetData: postId })
            .catch(error => { console.log(error); res.sendStatus(400); });
            
        // Criar Notificação
        // Precisamos de saber de quem é o post original para notificar
        var originalPost = await Post.findById(postId);
        await Notification.insertNotification(originalPost.postedBy, userId, "retweet", originalPost._id);
    }

    // Atualizar o User (adicionar/remover reposts)
    req.session.user = await User.findByIdAndUpdate(userId, { [option]: { retweets: repost._id } }, { new: true })
        .catch(error => { console.log(error); res.sendStatus(400); });

    // Atualizar o Post Original (adicionar/remover quem deu retweet)
    var post = await Post.findByIdAndUpdate(postId, { [option]: { retweetUsers: userId } }, { new: true })
        .catch(error => { console.log(error); res.sendStatus(400); });

    res.status(200).send(post);
});

module.exports = router;