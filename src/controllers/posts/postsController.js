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
        // 1. Buscar todos os posts
        // 2. .sort: Ordenar pelos mais recentes (-1)
        // 3. .populate: Trocar o ID "654..." pelos dados reais do User (firstName, profilePic, etc)
        const posts = await Post.find()
            .sort({ createdAt: -1 }) 
            .populate('postedBy'); 

        res.status(200).json(posts);

    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Erro ao buscar posts" });
    }
};

exports.likePost = async (req, res) => {
    try {
        const postId = req.params.id; // O ID vem do URL (ex: /api/posts/123/like)
        const userId = req.user._id;  // Quem está a dar o like (vem do Token)

        // 1. Primeiro verificamos se o user JÁ deu like neste post
        // Procuramos um post com este ID e onde o array 'likes' contenha o userId
        const post = await Post.findOne({ _id: postId, likes: userId });

        // Variável para definir o que vamos fazer (Adicionar ou Remover)
        const option = post ? '$pull' : '$addToSet';

        // 2. Atualizar o Post
        // [option] é uma "Computed Property Name", vai virar "$pull" ou "$addToSet" dinamicamente
        const updatedPost = await Post.findByIdAndUpdate(
            postId,
            { [option]: { likes: userId } },
            { new: true } // Retorna o objeto já atualizado para o frontend atualizar o contador
        )
        .populate('postedBy') // Importante para manter os dados do autor visíveis
        .populate('likes');   // Opcional: Se quiseres ver a lista de quem deu like

        res.status(200).json(updatedPost);

    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Erro ao dar like" });
    }
};