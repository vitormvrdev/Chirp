const express = require('express');
const router = express.Router();
const User = require('../models/user');

// Rota 1: /profile (sem nome) -> Redireciona para o perfil do user logado
router.get("/", (req, res, next) => {
    const user = req.session.user;
    if(user) {
        res.redirect(`/profile/${user.userhandle}`);
    } else {
        res.redirect("/login");
    }
});

// Rota 2: /profile/vitor (com nome) -> Mostra o perfil
router.get("/:username", async (req, res, next) => {
    // O 'username' aqui é o userhandle que vem na URL
    const payload = await getPayload(req.params.username, req.session.user);
    res.render("profile", payload);
});

async function getPayload(username, userLoggedIn) {
    // Procurar user pelo userhandle
    var user = await User.findOne({ userhandle: username });

    if(user == null) {
        // Se não encontrar pelo handle, tenta pelo ID (caso uses links antigos)
        try {
            user = await User.findById(username);
        } catch (error) {
            // Se falhar tudo, user não encontrado
             return {
                pageTitle: "User not found",
                userLoggedIn: userLoggedIn,
                userLoggedInJs: JSON.stringify(userLoggedIn),
                profileUser: null
            }
        }
    }

    return {
        pageTitle: user ? user.firstName : "User not found",
        userLoggedIn: userLoggedIn,
        userLoggedInJs: JSON.stringify(userLoggedIn),
        profileUser: user // Enviamos os dados do dono do perfil para a view
    }
}

module.exports = router;