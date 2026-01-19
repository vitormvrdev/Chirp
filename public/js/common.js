// 2. Lógica do Botão de Tweet (Ativar/Desativar)
$("#postTextarea").keyup((event) => {
    const textbox = $(event.target);
    const value = textbox.val().trim();
    
    const submitButton = $("#submitPostButton");

    if (submitButton.length == 0) return;

    if (value == "") {
        submitButton.prop("disabled", true);
        submitButton.addClass("opacity-50 cursor-not-allowed");
    } else {
        submitButton.prop("disabled", false);
        submitButton.removeClass("opacity-50 cursor-not-allowed");
    }
});

// 3. ENVIAR O POST (Quando clicas no botão)
$("#submitPostButton").click((event) => {
    const button = $(event.target);
    const textbox = $("#postTextarea");

    const data = {
        content: textbox.val()
    }

    // Enviar para a API via POST
    $.post("/api/posts", data, (postData) => {
        
        // Criar o HTML do novo post
        const html = createPostHtml(postData);
        
        // Adicionar ao topo da lista
        $(".postsContainer").prepend(html);
        
        // Limpar a caixa de texto
        textbox.val("");
        button.prop("disabled", true);
        button.addClass("opacity-50 cursor-not-allowed");
    });
});

// --- FUNÇÕES AUXILIARES ---

function outputPosts(results, container) {
    container.html(""); // Limpa o container antes de adicionar

    if(!Array.isArray(results)) {
        results = [results];
    }

    results.forEach(result => {
        const html = createPostHtml(result);
        container.append(html);
    });

    if (results.length == 0) {
        container.append("<span class='p-4 block text-center'>Nenhum post encontrado.</span>");
    }
}

function createPostHtml(postData) {
    
    // 1. LÓGICA DE RETWEET
    // Se o post tiver 'retweetData', significa que é um Repost.
    // O conteúdo real está dentro de retweetData.
    var isRetweet = postData.retweetData !== undefined;
    var retweetedBy = isRetweet ? postData.postedBy.userhandle : null;
    
    // Se for retweet, usamos os dados do post original
    postData = isRetweet ? postData.retweetData : postData;

    var postedBy = postData.postedBy;

    // Segurança para não crashar se o post não tiver autor
    if(postedBy._id === undefined) {
        return console.log("User object not populated");
    }

    const displayName = `${postedBy.firstName} ${postedBy.lastName}`;
    const timestamp = timeDifference(new Date(), new Date(postData.createdAt));
    const userHandle = postedBy.userhandle || postedBy.username; 
    const profilePic = postedBy.profilePic || "/images/profilePic.jpeg";

    // 2. VERIFICAR SE JÁ DEI LIKE / RETWEET (Para mudar a cor)
    // userLoggedIn é uma variável global que vem do layout
    // Garante que são arrays, mesmo que venham vazios ou undefined da base de dados
    var likesList = postData.likes || [];
    var retweetUsersList = postData.retweetUsers || [];

    var likeButtonClass = likesList.includes(userLoggedIn._id) ? "text-red-500" : "";
    var likeIconClass = likesList.includes(userLoggedIn._id) ? "fa-solid" : "fa-regular";
    var retweetButtonClass = retweetUsersList.includes(userLoggedIn._id) ? "text-green-500" : "";

    // 3. HTML DO CABEÇALHO DO RETWEET
    var retweetText = "";
    if(isRetweet) {
        retweetText = `
        <div class='text-gray-500 text-xs mb-2 flex items-center pl-4'>
            <i class='fa-solid fa-retweet mr-2'></i>
            <span>Retweetado por <a href='/profile/${retweetedBy}' class='hover:underline text-gray-500 font-bold'>@${retweetedBy}</a></span>
        </div>`;
    }

    // 4. RETORNAR HTML
    // Nota: Adicionei 'data-id' na div principal e as classes nos botões
    return `
    <div class='flex flex-col py-4 border-b border-gray-border hover:bg-gray-50 cursor-pointer transition-colors post' data-id='${postData._id}'>
        ${retweetText}
        <div class='flex px-4'>
            <div class='flex-shrink-0 mr-4'>
                <img src='${profilePic}' alt='Profile Pic' class='w-12 h-12 rounded-full bg-gray-300'>
            </div>
            <div class='flex flex-col flex-grow'>
                <div class='flex items-baseline mb-1'>
                    <a href='/profile/${userHandle}' class='font-bold text-gray-900 hover:underline mr-1'>
                        ${displayName}
                    </a>
                    <span class='text-gray-500 text-sm'>@${userHandle}</span>
                    <span class='text-gray-500 text-sm mx-1'>·</span>
                    <span class='text-gray-500 text-sm hover:underline'>${timestamp}</span>
                </div>
                <div class='text-gray-900 text-lg'>
                    ${postData.content}
                </div>
                
                <div class='flex mt-2 items-center space-x-10 text-gray-500'>
                    
                    <button class='flex items-center hover:text-blue-500 transition-colors group'>
                        <div class='p-2 rounded-full group-hover:bg-blue-50'>
                            <i class='fa-regular fa-comment text-lg'></i>
                        </div>
                    </button>

                    <button class='retweetButton flex items-center hover:text-green-500 transition-colors group ${retweetButtonClass}'>
                        <div class='p-2 rounded-full group-hover:bg-green-50'>
                            <i class='fa-solid fa-retweet text-lg'></i>
                        </div>
                        <span class='ml-1 text-sm'>${postData.retweetUsers.length || ""}</span>
                    </button>

                    <button class='likeButton flex items-center hover:text-pink-500 transition-colors group ${likeButtonClass}'>
                        <div class='p-2 rounded-full group-hover:bg-pink-50'>
                            <i class='${likeIconClass} fa-heart text-lg'></i>
                        </div>
                        <span class='ml-1 text-sm'>${postData.likes.length || ""}</span>
                    </button>
                </div>
            </div>
        </div>
    </div>`;
}

// Função para calcular "há quanto tempo" (ex: "5min")
function timeDifference(current, previous) {
    var msPerMinute = 60 * 1000;
    var msPerHour = msPerMinute * 60;
    var msPerDay = msPerHour * 24;
    var msPerMonth = msPerDay * 30;
    var msPerYear = msPerDay * 365;

    var elapsed = current - previous;

    // Se o tempo for negativo (diferença de relógio servidor/cliente), assume "agora"
    if (elapsed < 0) {
        return "agora mesmo";
    }

    if (elapsed < msPerMinute) {
        if(elapsed/1000 < 30) return "agora mesmo";
        return Math.round(elapsed/1000) + 's';   
    }
    else if (elapsed < msPerHour) {
        return Math.round(elapsed/msPerMinute) + ' min';   
    }
    else if (elapsed < msPerDay) {
        return Math.round(elapsed/msPerHour) + ' h';   
    }
    else if (elapsed < msPerMonth) {
        return Math.round(elapsed/msPerDay) + ' d';   
    }
    else if (elapsed < msPerYear) {
        return Math.round(elapsed/msPerMonth) + ' m';   
    }
    else {
        return Math.round(elapsed/msPerYear) + ' anos';   
    }
}

// CLIQUE NO LIKE
$(document).on("click", ".likeButton", (event) => {
    var button = $(event.target);
    var postId = getPostIdFromElement(button);
    
    if(postId === undefined) return;

    $.ajax({
        url: `/api/posts/${postId}/like`,
        type: "PUT",
        success: (postData) => {
            // Atualiza número
            button.find("span").text(postData.likes.length || "");
            
            // Muda a cor (se o user estiver no array de likes)
            if(postData.likes.includes(userLoggedIn._id)) {
                button.addClass("text-red-500");
                button.find("i").removeClass("fa-regular").addClass("fa-solid");
            } else {
                button.removeClass("text-red-500");
                button.find("i").removeClass("fa-solid").addClass("fa-regular");
            }
        }
    })
});

// CLIQUE NO RETWEET
$(document).on("click", ".retweetButton", (event) => {
    var button = $(event.target);
    var postId = getPostIdFromElement(button);

    if(postId === undefined) return;

    $.ajax({
        url: `/api/posts/${postId}/retweet`,
        type: "POST",
        success: (postData) => {
            // Atualiza número
            button.find("span").text(postData.retweetUsers.length || "");

            // Muda a cor
            if(postData.retweetUsers.includes(userLoggedIn._id)) {
                button.addClass("text-green-500");
            } else {
                button.removeClass("text-green-500");
            }
            
            // Recarrega a página se estivermos no perfil para mostrar o repost novo
            // (Opcional, mas ajuda a ver o resultado)
        }
    })
});

// Helper para encontrar o ID do post
function getPostIdFromElement(element) {
    var isRoot = element.hasClass("post");
    var rootElement = isRoot ? element : element.closest(".post");
    var postId = rootElement.data("id");

    if(postId === undefined) return alert("Post ID undefined");
    return postId;
}