const User = require('../../models/user');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

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

exports.login = async (req, res) => {
    // 1. Receber dados (pode ser userhandle ou email)
    const { loginData, password } = req.body; 

    if (!loginData || !password) {
        return res.status(400).json({ message: "Por favor preencha user/email e password." });
    }

    try {
        // 2. Encontrar o user (pelo email OU userhandle)
        // O $or permite procurar em dois campos ao mesmo tempo
        const user = await User.findOne({
            $or: [{ email: loginData }, { userhandle: loginData }]
        });

        if (!user) {
            return res.status(401).json({ message: "Credenciais inválidas." });
        }

        // 3. Verificar a password (comparar a que veio com a encriptada na BD)
        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
            return res.status(401).json({ message: "Credenciais inválidas." });
        }

        // 4. Gerar o Token (O tal "Crachá")
        // Guardamos o ID do user dentro do token para saber quem ele é depois
        const token = jwt.sign(
            { id: user._id, userhandle: user.userhandle }, 
            process.env.JWT_SECRET, 
            { expiresIn: '30d' } // Expira em 30 dias
        );

        // 5. Enviar o Token para o cliente
        res.status(200).json({
            success: true,
            token: token,
            user: {
                id: user._id,
                userhandle: user.userhandle,
                profilePic: user.profilePic
            }
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Erro no servidor ao fazer login." });
    }
};