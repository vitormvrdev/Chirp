// public/js/common.js

$(document).ready(() => {
    // 1. ASSIM QUE A PÁGINA CARREGA: Buscar posts à API
    $.get("/api/posts", (results) => {
        outputPosts(results, $(".postsContainer"));
    });
});

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
    const postedBy = postData.postedBy;

    if(postedBy._id === undefined) {
        return console.log("User object not populated");
    }

    const displayName = `${postedBy.firstName} ${postedBy.lastName}`;
    const timestamp = timeDifference(new Date(), new Date(postData.createdAt));

    // --- CORREÇÃO AQUI ---
    // Verifica se existe userhandle, se não, tenta username
    const userHandle = postedBy.userhandle || postedBy.username; 
    
    // Se a foto não existir, usa a default
    const profilePic = postedBy.profilePic || "/images/profilePic.jpeg";

    return `
    <div class='flex p-4 border-b border-gray-border hover:bg-gray-50 cursor-pointer transition-colors'>
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
                <button class='flex items-center hover:text-green-500 transition-colors group'>
                    <div class='p-2 rounded-full group-hover:bg-green-50'>
                        <i class='fa-solid fa-retweet text-lg'></i>
                    </div>
                </button>
                <button class='flex items-center hover:text-pink-500 transition-colors group'>
                    <div class='p-2 rounded-full group-hover:bg-pink-50'>
                        <i class='fa-regular fa-heart text-lg'></i>
                    </div>
                </button>
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