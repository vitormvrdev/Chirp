const express = require('express');
const router = express.Router();
const Post = require('../../models/post');
const User = require('../../models/user'); 

// GET /api/posts -> Busca TODOS os posts de TODA a gente
router.get("/", async (req, res, next) => {
    // Cria um objeto de busca vazio
    var searchObj = {};

    // Se a URL tiver ?postedBy=ID_DO_USER, filtramos por isso
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

// POST /api/posts -> Cria um post novo
router.post("/", async (req, res, next) => {
    
    // Se não vier texto, dá erro (a não ser que tenhas imagens, mas para já focamos no texto)
    if (!req.body.content) {
        console.log("Conteúdo não enviado");
        return res.sendStatus(400);
    }

    let postData = {
        content: req.body.content,
        postedBy: req.session.user // O user que está na sessão
    }

    Post.create(postData)
    .then(async newPost => {
        // Popula o autor logo após criar para podermos mostrar na hora
        newPost = await User.populate(newPost, { path: "postedBy" });
        res.status(201).send(newPost);
    })
    .catch(error => {
        console.log(error);
        res.sendStatus(400);
    })
});

module.exports = router;