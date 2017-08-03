function show_timestamp() {
    var ts = $.timeago(new Date(this.getAttribute('timestamp')));
    var ts_div = $(this).children("#timestamp");
    ts_div.text(ts);
    ts_div.css('display', 'inline-block');
}

function hide_timestamp() {
    $(this).children("#timestamp").css('display', 'none');
}

function getMessageContainer(room) {
    return $('#' + room + '.chatWindow .chatMessages')
}

function scrollChatToBottom(room, delay) {
    var delay = 500 * delay;
    setTimeout(function () {
        var messageContainer = getMessageContainer(room);
        if (!messageContainer.prop('pauseScroll')) {
            messageContainer.scrollTop(messageContainer.prop('scrollHeight'));
        }
        else {
            //FIXME: Subscribe to onclick events on these and hide/scroll them down
            $('#' + room + ' .chatEntry').notify(
                'New messages', {
                    elementPosition: 'top center',
                    autoHide: false,
                    style: 'unread',
                }
            );
        }
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
    var goldenLayoutTheme = $('#goldenLayoutTheme');
    var chatTheme = $('#chatTheme');
    var dict = {
        'light': ["//golden-layout.com/assets/css/goldenlayout-light-theme.css", "/static/styles/chat-light.css"],
        'dark': ["//golden-layout.com/files/latest/css/goldenlayout-dark-theme.css", "/static/styles/chat-dark.css"],
        //'soda' : "//golden-layout.com/files/latest/css/goldenlayout-dark-theme.css",
        //'translucent' : "//golden-layout.com/files/latest/css/goldenlayout-translucent-theme.css"
    };
    if ((styleSheet == 'undefined' || styleSheet == undefined)) {
        goldenLayoutTheme.attr('href', dict['dark'][0]);
        chatTheme.attr('href', dict['dark'][1]);

    }
    else {
        goldenLayoutTheme.attr('href', dict[styleSheet][0]);
        chatTheme.attr('href', dict[styleSheet][1]);
    }
}

function enterKeyPressed(e) {
    var code = e.keyCode || e.which;
    return code === 13
}