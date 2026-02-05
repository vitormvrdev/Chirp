$(document).ready(() => {
    loadPosts(1);
    initInfiniteScroll(loadPosts);
});

function loadPosts(page = 1) {
    return $.get(`/api/posts?page=${page}&limit=20`, (results) => {
        outputPosts(results, $('.postsContainer'), page > 1);
    });
}
