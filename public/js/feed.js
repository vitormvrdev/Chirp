$(document).ready(() => {
    // Isto diz à API: "Dá-me todos os posts!"
    $.get("/api/posts", (results) => {
        // Usa a função que está no common.js para desenhar os posts
        outputPosts(results, $(".postsContainer"));
    });
});