$(document).ready(function () {
    loadStoredStyleSheet();
/**--------------------------------Renderer------------------------------------**/
    var open_rooms = [];
    var twemoji = window.twemoji;
    var markdown = window.markdownit({
        linkify: true
    }).use(window.markdownitEmoji).use(window.markdownitMathjax());
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
        addMessage(msg, markdown)
    });

    socket.on('status', function (data) {
        console.log(data);
        var roomElem = $('#chatContent-'+data.room)[0];
        if (roomElem != null) {
            roomElem.innerHTML = data.online_users.join(' ');
        }
    });

/**------------------------------Golden Layout---------------------------------**/

    var config = {
        settings: {showPopoutIcon: false},
        content: []
    };

    var layoutContainer = $('#layoutContainer');
    var myLayout, savedState = localStorage.getItem('savedState');
    if (savedState !== null) {
        myLayout = new window.GoldenLayout(JSON.parse(savedState), layoutContainer);
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
    if (!savedState) {
        initalizeRoomList(myLayout)
    }

    // FIXME: Remove from open_rooms when the room is closed??
    for (i=0; i<open_rooms.length; i++) {
        addRoom(open_rooms[i], myLayout);
    }

    var roomEntry = $('#roomList #roomListEntry');

    roomEntry.keypress(function (e) {
        addToRoomList(e, roomEntry, myLayout);
    });

    layoutContainer.on('keypress', '.chatEntry', function (e) {
        sendMessage(e, socket, this)
    });

    layoutContainer.on('mouseenter touchstart', '.chatWindow .chatMessages #chatMessage', show_timestamp);
    layoutContainer.on('mouseleave touchend', '.chatWindow .chatMessages #chatMessage', hide_timestamp);

    $(window).resize(function () {
        myLayout.updateSize()
    })

});

function initalizeRoomList(layout) {
    layout.root.addChild({
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

function addRoom(roomName, layout) {
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
}

/**------------------------------Chat Windows---------------------------------**/
function chatWindowClosed(tab, socket) {
    socket.emit('left', {room: tab.contentItem.config.title});
    tab.contentItem.remove();
}

function addToRoomList(e, roomEntry, myLayout) {
    var code = e.keyCode || e.which;
    if (code === 13) {
        var roomName = $.trim(roomEntry.val());
        roomEntry.val('');
        if (roomName !== '' && roomName !== 'Room List') {
            addRoom(roomName, myLayout);
        }
    }
}

function sendMessage(e, socket, messageEntry) {
    var code = e.keyCode || e.which;
    if (code === 13) {
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