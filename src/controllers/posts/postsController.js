const Post = require('../../models/post');
const User = require('../../models/user');

exports.createPost = async (req, res) => {
    // Validar se enviou texto
    if (!req.body.content) {
        return res.status(400).json({ message: "O conteúdo do post é obrigatório" });
    }

    try {
        // O conteúdo vem do formulário (req.body.content)
        // O autor vem do Token que o middleware descodificou (req.user._id)
        const newPost = await Post.create({
            content: req.body.content,
            postedBy: req.user._id 
        });

        const post = await User.populate(newPost, { path: 'postedBy' });

        res.status(201).json(post);

    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Erro ao criar post" });
    }
};

exports.getAllPosts = async (req, res) => {
    try {
        const posts = await Post.find()
            .sort({ createdAt: -1 }) 
            .populate('postedBy') 
            .populate('retweetData')
            .populate({
                path: 'retweetData',
                populate: {
                    path: 'postedBy'
                }
            });

        res.status(200).json(posts);

    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Erro ao buscar posts" });
    }
};

exports.likePost = async (req, res) => {
    try {
        const postId = req.params.id;
        const userId = req.user._id;

        
        const post = await Post.findOne({ _id: postId, likes: userId });

        
        const option = post ? '$pull' : '$addToSet';

        req.user = await User.findByIdAndUpdate(
            userId,
            { [option]: { likes: postId } },
            { new: true }
        );

        const updatedPost = await Post.findByIdAndUpdate(
            postId,
            { [option]: { likes: userId } },
            { new: true }
        )
        .populate('postedBy')
        .populate('likes');

        res.status(200).json(updatedPost);

    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Erro ao processar o like" });
    }
};

exports.retweetPost = async (req, res) => {
    try {
        const postId = req.params.id;
        const userId = req.user._id;

        const deletedPost = await Post.findOneAndDelete({ 
            postedBy: userId, 
            retweetData: postId 
        });

        if (deletedPost) {
            return res.status(200).json({ 
                message: "Retweet removido", 
                post: deletedPost,
                action: "unretweet" 
            });
        }

        // 2. Se não existia, vamos CRIAR o Retweet
        const newRetweet = await Post.create({
            postedBy: userId,
            retweetData: postId
        });

        // Popula os dados para devolver ao frontend tudo bonitinho logo de imediato
        const populatedRetweet = await Post.findById(newRetweet._id)
            .populate('postedBy')
            .populate('retweetData');

        res.status(200).json({
            message: "Retweet criado",
            post: populatedRetweet,
            action: "retweet"
        });

    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Erro ao processar retweet" });
    }
};

exports.deletePost = async (req, res) => {
    try {
        const postId = req.params.id;
        const userId = req.user._id;
        const post = await Post.findById(postId);

        if (!post) {
            return res.status(404).json({ message: "Post não encontrado" });
        }

        if (post.postedBy.toString() !== userId.toString()) {
            return res.status(403).json({ message: "Não tens permissão para apagar este post" });
        }

        await Post.findByIdAndDelete(postId);

        res.status(202).json({ message: "Post apagado com sucesso" });

    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Erro ao apagar post" });
    }
};