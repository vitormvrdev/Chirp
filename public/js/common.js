// Global state
let currentPage = 1;
let isLoading = false;
let hasMorePosts = true;

// Character counter for posts
const MAX_CHARS = 280;

// Initialize character counter
function initCharacterCounter() {
    const textarea = $('#postTextarea');
    const counter = $('#charCounter');
    const submitButton = $('#submitPostButton');

    if (!textarea.length) return;

    textarea.on('input', function() {
        const remaining = MAX_CHARS - $(this).val().length;
        counter.text(remaining);

        if (remaining < 0) {
            counter.addClass('text-red-500');
            submitButton.prop('disabled', true).addClass('opacity-50 cursor-not-allowed');
        } else if (remaining < 20) {
            counter.removeClass('text-red-500').addClass('text-yellow-500');
            submitButton.prop('disabled', $(this).val().trim() === '').toggleClass('opacity-50 cursor-not-allowed', $(this).val().trim() === '');
        } else {
            counter.removeClass('text-red-500 text-yellow-500');
            submitButton.prop('disabled', $(this).val().trim() === '').toggleClass('opacity-50 cursor-not-allowed', $(this).val().trim() === '');
        }
    });
}

// Post button logic
$('#postTextarea').keyup((event) => {
    const textbox = $(event.target);
    const value = textbox.val().trim();
    const submitButton = $('#submitPostButton');

    if (submitButton.length == 0) return;

    if (value == '' || value.length > MAX_CHARS) {
        submitButton.prop('disabled', true);
        submitButton.addClass('opacity-50 cursor-not-allowed');
    } else {
        submitButton.prop('disabled', false);
        submitButton.removeClass('opacity-50 cursor-not-allowed');
    }
});

// Submit post
$('#submitPostButton').click(async (event) => {
    const button = $(event.target);
    const textbox = $('#postTextarea');
    const imageInput = $('#postImage');
    const content = textbox.val().trim();

    if (!content) return;

    button.prop('disabled', true).addClass('opacity-50');

    try {
        let imageUrl = null;

        // Upload image if present
        if (imageInput.length && imageInput[0].files && imageInput[0].files[0]) {
            const formData = new FormData();
            formData.append('image', imageInput[0].files[0]);

            const uploadRes = await $.ajax({
                url: '/api/upload/post',
                type: 'POST',
                data: formData,
                processData: false,
                contentType: false
            });

            imageUrl = uploadRes.imageUrl;
        }

        // Create post
        const postData = await $.post('/api/posts', { content, imageUrl });

        const html = createPostHtml(postData);
        $('.postsContainer').prepend(html);

        textbox.val('');
        if (imageInput.length) {
            imageInput.val('');
            $('#imagePreview').addClass('hidden').find('img').attr('src', '');
        }
        $('#charCounter').text(MAX_CHARS);

    } catch (error) {
        console.error('Error creating post:', error);
        showToast('Erro ao criar post', 'error');
    }

    button.addClass('opacity-50 cursor-not-allowed');
});

// Output posts
function outputPosts(results, container, append = false) {
    if (!append) {
        container.html('');
    }

    // Handle new API response format with pagination
    let posts = results;
    if (results.posts) {
        posts = results.posts;
        hasMorePosts = results.pagination?.hasMore ?? false;
    }

    if (!Array.isArray(posts)) {
        posts = [posts];
    }

    posts.forEach(result => {
        const html = createPostHtml(result);
        container.append(html);
    });

    if (posts.length == 0 && !append) {
        container.append("<span class='p-4 block text-center text-gray-500'>Nenhum post encontrado.</span>");
    }
}

// Create post HTML
function createPostHtml(postData) {
    // Retweet logic
    var isRetweet = postData.retweetData !== undefined;
    var retweetedBy = isRetweet ? postData.postedBy.userhandle : null;

    if (isRetweet) {
        postData = postData.retweetData;
    }

    var postedBy = postData.postedBy;

    if (!postedBy || postedBy._id === undefined) {
        return '';
    }

    const displayName = `${postedBy.firstName} ${postedBy.lastName}`;
    const timestamp = timeDifference(new Date(), new Date(postData.createdAt));
    const userHandle = postedBy.userhandle || postedBy.username;
    const profilePic = postedBy.profilePic || '/images/profile_pic.png';

    // Check if user liked/retweeted
    var likesList = postData.likes || [];
    var retweetUsersList = postData.retweetUsers || [];

    var likeButtonClass = likesList.includes(userLoggedIn._id) ? 'text-red-500' : '';
    var likeIconClass = likesList.includes(userLoggedIn._id) ? 'fa-solid' : 'fa-regular';
    var retweetButtonClass = retweetUsersList.includes(userLoggedIn._id) ? 'text-green-500' : '';

    // Can delete own posts
    var isOwnPost = postedBy._id === userLoggedIn._id;
    var deleteButton = isOwnPost ? `
        <button class='deleteButton ml-auto text-gray-400 hover:text-red-500 transition-colors'>
            <i class='fa-regular fa-trash-can'></i>
        </button>` : '';

    // Retweet header
    var retweetText = '';
    if (isRetweet) {
        retweetText = `
        <div class='text-gray-500 text-xs mb-2 flex items-center pl-4'>
            <i class='fa-solid fa-retweet mr-2'></i>
            <span>Retweetado por <a href='/profile/${retweetedBy}' class='hover:underline text-gray-500 font-bold'>@${retweetedBy}</a></span>
        </div>`;
    }

    // Image in post
    var imageHtml = '';
    if (postData.imageUrl) {
        imageHtml = `
        <div class='mt-3 rounded-xl overflow-hidden border border-gray-200'>
            <img src='${postData.imageUrl}' alt='Post image' class='max-w-full max-h-96 object-cover'>
        </div>`;
    }

    return `
    <div class='flex flex-col py-4 border-b border-gray-border hover:bg-gray-50 transition-colors post' data-id='${postData._id}'>
        ${retweetText}
        <div class='flex px-4'>
            <div class='flex-shrink-0 mr-4'>
                <a href='/profile/${userHandle}'>
                    <img src='${profilePic}' alt='Profile Pic' class='w-12 h-12 rounded-full bg-gray-300 object-cover'>
                </a>
            </div>
            <div class='flex flex-col flex-grow'>
                <div class='flex items-baseline mb-1'>
                    <a href='/profile/${userHandle}' class='font-bold text-gray-900 hover:underline mr-1'>
                        ${displayName}
                    </a>
                    <span class='text-gray-500 text-sm'>@${userHandle}</span>
                    <span class='text-gray-500 text-sm mx-1'>·</span>
                    <span class='text-gray-500 text-sm hover:underline'>${timestamp}</span>
                    ${deleteButton}
                </div>
                <div class='text-gray-900 text-lg whitespace-pre-wrap break-words'>
                    ${escapeHtml(postData.content || '')}
                </div>
                ${imageHtml}

                <div class='flex mt-3 items-center space-x-10 text-gray-500'>
                    <button class='commentButton flex items-center hover:text-blue-500 transition-colors group'>
                        <div class='p-2 rounded-full group-hover:bg-blue-50'>
                            <i class='fa-regular fa-comment text-lg'></i>
                        </div>
                    </button>

                    <button class='retweetButton flex items-center hover:text-green-500 transition-colors group ${retweetButtonClass}'>
                        <div class='p-2 rounded-full group-hover:bg-green-50'>
                            <i class='fa-solid fa-retweet text-lg'></i>
                        </div>
                        <span class='ml-1 text-sm'>${retweetUsersList.length || ''}</span>
                    </button>

                    <button class='likeButton flex items-center hover:text-pink-500 transition-colors group ${likeButtonClass}'>
                        <div class='p-2 rounded-full group-hover:bg-pink-50'>
                            <i class='${likeIconClass} fa-heart text-lg'></i>
                        </div>
                        <span class='ml-1 text-sm'>${likesList.length || ''}</span>
                    </button>
                </div>
            </div>
        </div>
    </div>`;
}

// Time difference
function timeDifference(current, previous) {
    var msPerMinute = 60 * 1000;
    var msPerHour = msPerMinute * 60;
    var msPerDay = msPerHour * 24;
    var msPerMonth = msPerDay * 30;
    var msPerYear = msPerDay * 365;

    var elapsed = current - previous;

    if (elapsed < 0) return 'agora mesmo';
    if (elapsed < msPerMinute) {
        if (elapsed / 1000 < 30) return 'agora mesmo';
        return Math.round(elapsed / 1000) + 's';
    }
    if (elapsed < msPerHour) return Math.round(elapsed / msPerMinute) + ' min';
    if (elapsed < msPerDay) return Math.round(elapsed / msPerHour) + ' h';
    if (elapsed < msPerMonth) return Math.round(elapsed / msPerDay) + ' d';
    if (elapsed < msPerYear) return Math.round(elapsed / msPerMonth) + ' m';
    return Math.round(elapsed / msPerYear) + ' anos';
}

// Escape HTML to prevent XSS
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Like handler
$(document).on('click', '.likeButton', function(event) {
    event.stopPropagation();
    var button = $(this);
    var postId = getPostIdFromElement(button);

    if (!postId) return;

    $.ajax({
        url: `/api/posts/${postId}/like`,
        type: 'PUT',
        success: (postData) => {
            button.find('span').text(postData.likes.length || '');

            if (postData.likes.some(like => (like._id || like) === userLoggedIn._id)) {
                button.addClass('text-red-500');
                button.find('i').removeClass('fa-regular').addClass('fa-solid');
            } else {
                button.removeClass('text-red-500');
                button.find('i').removeClass('fa-solid').addClass('fa-regular');
            }
        },
        error: () => showToast('Erro ao processar like', 'error')
    });
});

// Retweet handler
$(document).on('click', '.retweetButton', function(event) {
    event.stopPropagation();
    var button = $(this);
    var postId = getPostIdFromElement(button);

    if (!postId) return;

    $.ajax({
        url: `/api/posts/${postId}/retweet`,
        type: 'POST',
        success: (postData) => {
            button.find('span').text(postData.retweetUsers.length || '');

            if (postData.retweetUsers.includes(userLoggedIn._id)) {
                button.addClass('text-green-500');
            } else {
                button.removeClass('text-green-500');
            }
        },
        error: () => showToast('Erro ao processar retweet', 'error')
    });
});

// Delete handler
$(document).on('click', '.deleteButton', function(event) {
    event.stopPropagation();
    var button = $(this);
    var postId = getPostIdFromElement(button);

    if (!postId) return;

    if (!confirm('Tens a certeza que queres apagar este post?')) return;

    $.ajax({
        url: `/api/posts/${postId}`,
        type: 'DELETE',
        success: () => {
            button.closest('.post').fadeOut(300, function() {
                $(this).remove();
            });
            showToast('Post apagado', 'success');
        },
        error: () => showToast('Erro ao apagar post', 'error')
    });
});

// Comment button handler
$(document).on('click', '.commentButton', function(event) {
    event.stopPropagation();
    var postId = getPostIdFromElement($(this));
    if (postId) {
        showCommentModal(postId);
    }
});

// Get post ID helper
function getPostIdFromElement(element) {
    var isRoot = element.hasClass('post');
    var rootElement = isRoot ? element : element.closest('.post');
    var postId = rootElement.data('id');
    return postId || null;
}

// Toast notifications
function showToast(message, type = 'info') {
    const toast = $(`
        <div class='fixed bottom-4 right-4 px-6 py-3 rounded-lg shadow-lg text-white transform translate-y-full opacity-0 transition-all duration-300 z-50
            ${type === 'error' ? 'bg-red-500' : type === 'success' ? 'bg-green-500' : 'bg-blue-500'}'>
            ${message}
        </div>
    `);

    $('body').append(toast);

    setTimeout(() => toast.removeClass('translate-y-full opacity-0'), 10);
    setTimeout(() => {
        toast.addClass('translate-y-full opacity-0');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// Comment modal
function showCommentModal(postId) {
    const modal = $(`
        <div id='commentModal' class='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50'>
            <div class='bg-white rounded-xl w-full max-w-lg mx-4 p-4'>
                <div class='flex justify-between items-center mb-4'>
                    <h3 class='font-bold text-lg'>Comentar</h3>
                    <button id='closeCommentModal' class='text-gray-500 hover:text-gray-700'>
                        <i class='fa-solid fa-xmark text-xl'></i>
                    </button>
                </div>
                <div class='commentsContainer max-h-60 overflow-y-auto mb-4'></div>
                <textarea id='commentTextarea' class='w-full border rounded-lg p-3 resize-none' rows='3' placeholder='Escreve o teu comentário...' maxlength='280'></textarea>
                <div class='flex justify-end mt-3'>
                    <button id='submitComment' class='bg-blue-500 text-white px-4 py-2 rounded-full font-bold hover:bg-blue-600 disabled:opacity-50' disabled>
                        Comentar
                    </button>
                </div>
            </div>
        </div>
    `);

    $('body').append(modal);

    // Load existing comments
    $.get(`/api/posts/${postId}/comments`, (comments) => {
        const container = modal.find('.commentsContainer');
        if (comments.length === 0) {
            container.html('<p class="text-gray-500 text-center py-4">Sê o primeiro a comentar!</p>');
        } else {
            comments.forEach(comment => {
                container.append(createCommentHtml(comment));
            });
        }
    });

    // Enable/disable submit button
    modal.find('#commentTextarea').on('input', function() {
        modal.find('#submitComment').prop('disabled', $(this).val().trim() === '');
    });

    // Submit comment
    modal.find('#submitComment').click(function() {
        const content = modal.find('#commentTextarea').val().trim();
        if (!content) return;

        $.ajax({
            url: `/api/posts/${postId}/comments`,
            type: 'POST',
            data: { content },
            success: (comment) => {
                const container = modal.find('.commentsContainer');
                if (container.find('p.text-gray-500').length) {
                    container.empty();
                }
                container.prepend(createCommentHtml(comment));
                modal.find('#commentTextarea').val('');
                modal.find('#submitComment').prop('disabled', true);
                showToast('Comentário adicionado', 'success');
            },
            error: () => showToast('Erro ao comentar', 'error')
        });
    });

    // Close modal
    modal.find('#closeCommentModal').click(() => modal.remove());
    modal.click((e) => {
        if (e.target === modal[0]) modal.remove();
    });
}

function createCommentHtml(comment) {
    const user = comment.postedBy;
    const time = timeDifference(new Date(), new Date(comment.createdAt));

    return `
        <div class='flex p-3 border-b border-gray-100'>
            <img src='${user.profilePic || "/images/profile_pic.png"}' class='w-8 h-8 rounded-full mr-3'>
            <div class='flex-grow'>
                <div class='flex items-center'>
                    <span class='font-bold text-sm'>${user.firstName}</span>
                    <span class='text-gray-500 text-xs ml-2'>@${user.userhandle}</span>
                    <span class='text-gray-400 text-xs ml-2'>${time}</span>
                </div>
                <p class='text-sm mt-1'>${escapeHtml(comment.content)}</p>
            </div>
        </div>
    `;
}

// Follow button handler
$(document).on('click', '#followButton', function() {
    const button = $(this);
    const userId = button.data('user-id');

    if (!userId) return;

    $.ajax({
        url: `/api/follow/${userId}`,
        type: 'PUT',
        success: (response) => {
            if (response.isFollowing) {
                button.text('A seguir').removeClass('bg-blue-500 hover:bg-blue-600').addClass('bg-gray-200 text-gray-800 hover:bg-red-100 hover:text-red-500');
                button.attr('data-following', 'true');
            } else {
                button.text('Seguir').removeClass('bg-gray-200 text-gray-800 hover:bg-red-100 hover:text-red-500').addClass('bg-blue-500 hover:bg-blue-600 text-white');
                button.attr('data-following', 'false');
            }

            // Update follower count
            const followerCount = $('#followerCount');
            if (followerCount.length) {
                followerCount.text(response.followersCount);
            }
        },
        error: () => showToast('Erro ao processar', 'error')
    });
});

// Infinite scroll
function initInfiniteScroll(loadFunction) {
    $(window).scroll(function() {
        if (isLoading || !hasMorePosts) return;

        if ($(window).scrollTop() + $(window).height() > $(document).height() - 200) {
            isLoading = true;
            currentPage++;
            loadFunction(currentPage).always(() => {
                isLoading = false;
            });
        }
    });
}

// Image preview
$(document).on('change', '#postImage', function() {
    const file = this.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            $('#imagePreview').removeClass('hidden').find('img').attr('src', e.target.result);
        };
        reader.readAsDataURL(file);
    }
});

$(document).on('click', '#removeImage', function() {
    $('#postImage').val('');
    $('#imagePreview').addClass('hidden').find('img').attr('src', '');
});

// Notification badge
function updateNotificationBadge() {
    $.get('/notifications/count', (data) => {
        const badge = $('#notificationBadge');
        if (data.count > 0) {
            badge.text(data.count > 99 ? '99+' : data.count).removeClass('hidden');
        } else {
            badge.addClass('hidden');
        }
    });
}

// Poll for notifications every minute
if (typeof userLoggedIn !== 'undefined' && userLoggedIn) {
    setInterval(updateNotificationBadge, 60000);
    updateNotificationBadge();
}

// Initialize
$(document).ready(() => {
    initCharacterCounter();
});
