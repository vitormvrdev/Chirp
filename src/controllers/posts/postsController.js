const Post = require('../../models/post'); // Confirma se o caminho e o nome (Post.js) estão certos
const User = require('../../models/user');

exports.createPost = async (req, res) => {
    // Validar se enviou texto
    if (!req.body.content) {
        return res.status(400).json({ message: "O conteúdo do post é obrigatório" });
    }

    try {
        // A MAGIA:
        // O conteúdo vem do formulário (req.body.content)
        // O autor vem do Token que o middleware descodificou (req.user._id)
        const newPost = await Post.create({
            content: req.body.content,
            postedBy: req.user._id 
        });

        // Vamos "popular" logo o user para devolver o post completo ao frontend
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
            .populate('postedBy') // Dados de quem fez o post (ou o retweet)
            .populate('retweetData') // Dados do post original
            .populate({
                path: 'retweetData', // Entra dentro do post original...
                populate: {
                    path: 'postedBy' // ...e vai buscar o autor do post original!
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

        // 1. Verificar se o post existe e se o user já deu like
        const post = await Post.findOne({ _id: postId, likes: userId });

        // 2. Definir a operação (Adicionar ou Remover)
        const option = post ? '$pull' : '$addToSet';

        // 3. Atualizar o User (Adicionar/Remover o ID do Post na lista do User)
        // A MAGIA DUPLA: Atualizamos o User...
        req.user = await User.findByIdAndUpdate(
            userId,
            { [option]: { likes: postId } },
            { new: true }
        );

        // 4. Atualizar o Post (Adicionar/Remover o ID do User na lista do Post)
        // ... e atualizamos o Post
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

        // 1. Tentar encontrar se este user JÁ retweetou este post
        // Procuramos um post que tenha sido criado por MIM (userId)
        // E que tenha o campo retweetData apontando para o post que cliquei (postId)
        const deletedPost = await Post.findOneAndDelete({ 
            postedBy: userId, 
            retweetData: postId 
        });

        if (deletedPost) {
            // Se encontrou e apagou, significa que foi um "Un-retweet"
            // Retornamos o post original (para o frontend atualizar contadores se quiseres)
            // Ou apenas uma mensagem de sucesso.
            return res.status(200).json({ 
                message: "Retweet removido", 
                post: deletedPost,
                action: "unretweet" // Ajuda o frontend a saber o que aconteceu
            });
        }

        // 2. Se não existia, vamos CRIAR o Retweet
        const newRetweet = await Post.create({
            postedBy: userId,
            retweetData: postId // A MAGIA: Só precisamos disto para ligar os dois
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

        // 1. Procurar o post
        const post = await Post.findById(postId);

        if (!post) {
            return res.status(404).json({ message: "Post não encontrado" });
        }

        // 2. SEGURANÇA: Verificar se quem quer apagar é o dono do post
        // Precisamos converter para String porque o ID do MongoDB é um Objeto complexo
        if (post.postedBy.toString() !== userId.toString()) {
            return res.status(403).json({ message: "Não tens permissão para apagar este post" });
        }

        // 3. Se passou no teste, apaga
        await Post.findByIdAndDelete(postId);

        res.status(202).json({ message: "Post apagado com sucesso" });

    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Erro ao apagar post" });
    }
};