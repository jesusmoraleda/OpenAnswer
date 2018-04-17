$(document).ready(function () {
    /**---------------------------IE, Y U MAKE ME DO DIS???-----------------------**/
    // Disabling the alpha chat in IE for now as we have users constantly asking us how to use the site, without realizing that it's actually broken.
    // https://stackoverflow.com/questions/9847580/how-to-detect-safari-chrome-ie-firefox-and-opera-browser
    // Internet Explorer 6-11
    var isIE = /*@cc_on!@*/false || !!document.documentMode;
    if (isIE) {
        var legacy_chat = location.protocol + '//' + document.domain + '/chat/lobby';
        $('.browser_warning')[0].innerHTML = '<h2>Unsupported browser detected. Please switch to the <a href='+legacy_chat+'>legacy chat</a></h2>';
        return;
    }
    var is_visible = visibility();
    var unread = 0;
    var favicon = new Favico({
        animation: 'none',
        bgColor: '#26436B'
    });
    loadStoredStyleSheet();
    $.notify.addStyle('unread', {
      html: "<div><span data-notify-text/></div>",
      classes: {
          //FIXME: Move to css file
        base: {
          "white-space": "nowrap",
          "background-color": "#757373",
          "padding": "5px",
        },
      }
    });
    /**--------------------------------Renderer------------------------------------**/
    var open_rooms = [];
    var twemoji = window.twemoji;
    var markdown = window.markdownit({
        linkify: true
    }).use(window.markdownitEmoji)
        .use(window.markdownitMathjax())
        .use(window.markdownitVideo());
    markdown.renderer.rules.emoji = function (token, idx) {
        return twemoji.parse(token[idx].content);
    };
    var defaultRender = markdown.renderer.rules.link_open || function (tokens, idx, options, env, self) {
            return self.renderToken(tokens, idx, options);
        };
    markdown.renderer.rules.link_open = function (tokens, idx, options, env, self) {
        // If you are sure other plugins can't add `target` - drop check below
        var aIndex = tokens[idx].attrIndex('target');
        if (aIndex < 0) {
            tokens[idx].attrPush(['target', '_blank']); // add new attribute
        } else {
            tokens[idx].attrs[aIndex][1] = '_blank';    // replace value of existing attr
        }
        // pass token to default renderer.
        return defaultRender(tokens, idx, options, env, self);
    };

    /**--------------------------------Sockets------------------------------------**/
    var socket = io.connect(location.protocol + '//' + document.domain + ':' + location.port + '/chat');

    socket.on('received', function (msg) {
        addMessage(msg, markdown);
        if (!is_visible()) {
            unread += 1;
            favicon.badge(unread)
        }
        else {
            unread = 0;
            favicon.badge(unread)
        }
    });

    socket.on('status', function (data) {
        var roomElem = $('#chatContent-' + data.room)[0];
        if (roomElem != null) {
            roomElem.innerHTML = data.online_users.join(' ');
        }
    });

    window.onload = function() {initGoldenLayout(socket, open_rooms, markdown)};
});

function initGoldenLayout(socket, open_rooms, markdown) {
    /**------------------------------Golden Layout---------------------------------**/
    var config = {
        settings: {showPopoutIcon: false},
        content: [
            {
                type: 'row',
                isClosable: false,
                content: []
            }
        ]
    };

    var layoutContainer = $('#layoutContainer');
    var myLayout, savedState = localStorage.getItem('savedState');
    if (savedState !== null) {
        var saved = JSON.parse(savedState);
        console.log(saved);
        myLayout = new window.GoldenLayout(saved, layoutContainer);
    } else {
        myLayout = new window.GoldenLayout(config, layoutContainer);
    }

    myLayout.on('stateChanged', function () {
        var state = JSON.stringify(myLayout.toConfig());
        localStorage.setItem('savedState', state);
    });

    myLayout.registerComponent('tab', function (container, state) {
        if (state.name !== 'Room List') {
            open_rooms.push(state.name);
        }
        container.getElement().html(state.text);
        container.on('tab', function (tab) {
            tab
                .closeElement
                .off('click') //unbind the current click handler
                .click(function () {
                    chatWindowClosed(tab, socket)
                });
        });
        $.getJSON('../messages/' + state.name, function (data) {
            $.each(data.messages, function (idx, msg) {
                addMessage(msg, markdown);
            });
            scrollChatToBottom(state.name, 0);
        });
        socket.emit('joined', {room: state.name});
    });

    myLayout.init();
    // FIXME: Remove from open_rooms when the room is closed??
    for (i = 0; i < open_rooms.length; i++) {
        addRoom(open_rooms[i], myLayout);
    }

    if (!savedState) {
        initalizeRoomList(myLayout);
        addRoom('lobby', myLayout, true);
    }

    var roomEntry = $('#roomList #roomListEntry');

    roomEntry.keypress(function (e) {
        addToRoomList(e, roomEntry, myLayout);
    });

    layoutContainer.on('keypress', '.chatEntry', function (e) {
        sendMessage(e, socket, this);
    });

    layoutContainer.on('mouseenter touchstart', '.chatWindow .chatMessages #chatMessage', show_timestamp);
    layoutContainer.on('mouseleave touchend', '.chatWindow .chatMessages #chatMessage', hide_timestamp);
    layoutContainer.on('focus', '.chatEntry', function (e) {
        unread = 0;
        favicon.badge(unread)
    });

    $(window).resize(function () {
        myLayout.updateSize()
    })
}

function initalizeRoomList(layout) {
    layout.root.contentItems[0].addChild({
        title: 'Room List',
        type: 'component',
        componentName: 'tab',
        componentState: {
            text: '<div id="roomList">' +
            '<input class="chatEntry" id="roomListEntry" type="text">' +
            '</div>',
            name: 'Room List'
        },
        isClosable: false
    });
}

function addRoom(roomName, layout, openChatTab) {
    var newRoom = {
        title: roomName,
        type: 'component',
        componentName: 'tab',
        componentState: {
            text: getChatRoomTemplate(roomName),
            name: roomName
        }
    };
    var roomListElement = $(getRoomListElement(roomName));

    $('#roomList').prepend(roomListElement);
    layout.createDragSource(roomListElement, newRoom);
    if (openChatTab) {
        layout.root.contentItems[0].addChild(newRoom);
    }

    //Set up scroll events
    var messageContainer = getMessageContainer(roomName);
    messageContainer.scroll(function (e) {
        messageContainer.prop('pauseScroll', false);
        var currentScroll = $(this).scrollTop();
        if (currentScroll < this.lastScroll) {
            messageContainer.prop('pauseScroll', true);
        }
        this.lastScroll = currentScroll;
    });
}

/**------------------------------Chat Windows---------------------------------**/
function chatWindowClosed(tab, socket) {
    socket.emit('left', {room: tab.contentItem.config.title});
    tab.contentItem.remove();
}

function addToRoomList(e, roomEntry, layout) {
    if (enterKeyPressed(e)) {
        var roomName = $.trim(roomEntry.val());
        roomEntry.val('');
        if (roomName !== '' && roomName !== 'Room List') {
            addRoom(roomName, layout, openChatTab = true);
        }
    }
}

function sendMessage(e, socket, messageEntry) {
    if (enterKeyPressed(e)) {
        var msg = $.trim($(messageEntry).val());
        if (msg !== '') {
            socket.emit('sent', {msg: $(messageEntry).val(), room: messageEntry.id, sid: socket.id});
            messageEntry.value = '';
        }
    }
}

function addMessage(msg, markdown) {
    $('#' + msg.room + '.chatWindow .chatMessages').append(getMessageTemplate(msg, markdown));
    renderMathJax();
    scrollChatToBottom(msg.room, 0);
}
