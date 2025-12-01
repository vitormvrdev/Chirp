const jwt = require('jsonwebtoken');
const User = require('../models/user');

exports.protect = async (req, res, next) => {
    let token;

    // 1. Verificar se o Header "Authorization" existe e começa com "Bearer"
    // O formato padrão é: "Bearer eyJhbGciOiJIUz..."
    if (
        req.headers.authorization && 
        req.headers.authorization.startsWith('Bearer')
    ) {
        try {
            // 2. Extrair o token (tirar a palavra "Bearer " da frente)
            token = req.headers.authorization.split(' ')[1];

            // 3. Descodificar o token (Verificar a assinatura com o segredo)
            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            // 4. Buscar o user à BD e anexar ao pedido (req.user)
            // O .select('-password') serve para não trazer a password encriptada para a memória
            req.user = await User.findById(decoded.id).select('-password');

            // 5. Deixar passar!
            next(); 

        } catch (error) {
            console.error(error);
            return res.status(401).json({ message: "Não autorizado, token falhou." });
        }
    }

    if (!token) {
        return res.status(401).json({ message: "Não autorizado, sem token." });
    }
};