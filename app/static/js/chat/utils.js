function show_timestamp() {
    var ts = $.timeago(new Date(this.getAttribute('timestamp')));
    var ts_div = $(this).children("#timestamp");
    ts_div.text(ts);
    ts_div.css('display', 'inline-block');
}

function hide_timestamp() {
    $(this).children("#timestamp").css('display', 'none');
}

function scrollChatToBottom(room, delay) {
    var delay = 500 * delay;
    setTimeout(function () {
        var chatroom = $('#' + room + '.chatWindow .chatMessages');
        chatroom.scrollTop(chatroom.prop("scrollHeight"));
    }, delay);
}

function renderMathJax() {
    try {
        MathJax.Hub.Queue(["Typeset", MathJax.Hub]);
    }
    catch (e) {
        console.log(e);
    }
}

function loadStoredStyleSheet() {
    var styleSheet = localStorage.getItem('goldenLayoutTheme');
    var link = $('#goldenLayoutTheme')
    var dict = {
        'light': "//golden-layout.com/assets/css/goldenlayout-light-theme.css",
        'dark': "//golden-layout.com/files/latest/css/goldenlayout-dark-theme.css",
        'soda' : "//golden-layout.com/files/latest/css/goldenlayout-dark-theme.css",
        'translucent' : "//golden-layout.com/files/latest/css/goldenlayout-translucent-theme.css"
    }
    if ((styleSheet == 'undefined' || styleSheet == undefined)) {
        link.attr('href', dict.dark);
    }
    else {
        link.attr('href', dict[styleSheet]);
    }
}