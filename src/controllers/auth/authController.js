const User = require('../../models/user');
const bcrypt = require('bcryptjs');

exports.register = async (req, res) => {
    console.log("Dados recebidos:", req.body);
    // Receber os dados do formulário (ou do Postman)
    const { firstName, lastName, userhandle, email, password } = req.body;

    // Validação básica
    if (!firstName || !lastName || !userhandle || !email || !password) {
        return res.status(400).json({ message: "Por favor preencha todos os campos." });
    }

    try {
        // Verificar se user já existe
        const userExists = await User.findOne({ 
            $or: [{ email: email }, { userhandle: userhandle }] 
        });

        if (userExists) {
            return res.status(400).json({ message: "Userhandle ou Email já registado." });
        }

        // Encriptar a password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Criar o Utilizador
        const user = await User.create({
            firstName,
            lastName,
            userhandle,
            email,
            password: hashedPassword // Guardamos a versão encriptada!
        });

        // Sucesso!
        // Mais tarde aqui vamos gerar o token JWT. Para já, devolvemos o user.
        res.status(201).json({
            success: true,
            user: {
                id: user._id,
                userhandle: user.userhandle,
                email: user.email
            }
        });

    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Erro ao registar utilizador." });
    }
};