var ultrilliam = {
    addYoutube: function(message) {
        var r1 = /youtube.com\/watch.*[?&]v=(.{11})/i;
		var r2 = /youtu.be\/(.{11})/i;
		var isYoutube = r1.test(message) || r2.test(message);
		if (isYoutube) {
          var videoId = RegExp.$1;
          var message = message + '<br/>';
          return (message + '<iframe width="160" height="200" src="https://www.youtube.com/embed/' + videoId + '" frameborder="0" allowfullscreen></iframe>');
		}
		return message;
	},
    checkScroll: function(element) {
        var delta = Math.floor(element[0].scrollHeight) - Math.floor(element.scrollTop());
        return (delta - 150 < element.height()) && (delta + 150 > element.height());
    }
};

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

function scrollChatToBottom(room, delay, forceScroll) {
    var delay = 500 * delay;
    forceScroll = typeof forceScroll !== 'undefined' ? forceScroll : false;
    setTimeout(function () {
        var messageContainer = getMessageContainer(room);
        if (!messageContainer.prop('pauseScroll')) {
            //forceScroll when we don't care about sizes and just want to scroll down (i.e. on first load)
            if (forceScroll || ultrilliam.checkScroll(messageContainer)) {
                messageContainer.scrollTop(messageContainer.prop('scrollHeight'));
            }
        } else {
            $('#' + room + ' .chatEntry').notify('New messages', {
                elementPosition: 'top center',
                autoHide: false,
                style: 'unread',
            }).parent().find('.notifyjs-wrapper').click(function() {
                messageContainer.scrollTop(messageContainer.prop('scrollHeight'));
            });
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

// function loadStoredStyleSheet() {
//     var styleSheet = localStorage.getItem('goldenLayoutTheme');
//     var goldenLayoutTheme = $('#goldenLayoutTheme');
//     var chatTheme = $('#chatTheme');
//     var dict = {
//         'light': ["//golden-layout.com/assets/css/goldenlayout-light-theme.css", "/static/styles/chat-light.css"],
//         'dark': ["//golden-layout.com/files/latest/css/goldenlayout-dark-theme.css", "/static/styles/chat-dark.css"],
//         //'soda' : "//golden-layout.com/files/latest/css/goldenlayout-dark-theme.css",
//         //'translucent' : "//golden-layout.com/files/latest/css/goldenlayout-translucent-theme.css"
//     };
//     if ((styleSheet == 'undefined' || styleSheet == undefined)) {
//         goldenLayoutTheme.attr('href', dict['dark'][0]);
//         chatTheme.attr('href', dict['dark'][1]);
//
//     }
//     else {
//         goldenLayoutTheme.attr('href', dict[styleSheet][0]);
//         chatTheme.attr('href', dict[styleSheet][1]);
//     }
// }

function enterKeyPressed(e) {
    var code = e.keyCode || e.which;
    return code === 13
}
