$(document).ready(() => {
    loadPosts();
});

function loadPosts() {
    // profileUserId foi definido no .pug acima
    // Chamamos a API com o filtro ?postedBy=ID
    $.get("/api/posts", { postedBy: profileUserId }, (results) => {
        outputPosts(results, $(".postsContainer"));
    });
}