$(document).ready(function () {
    loadStoredStyleSheet();
    //markdown stuff
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

    //socket stuff
    var socket = io.connect(location.protocol + '//' + document.domain + ':' + location.port + '/chat');

    socket.on('received', function (msg) {
        addMessage(msg, markdown)
    });
    var config = {
        settings: {showPopoutIcon: false},
        content: []
    };

    //layout stuff
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
        container.getElement().html(state.text);
        $.getJSON('../messages/' + state.name, function (data) {
            $.each(data.messages, function (idx, msg) {
                addMessage(msg, markdown);
            });
            scrollChatToBottom(state.name, 0);
        });
        socket.emit('joined', {room: state.name});
    });
    myLayout.init();
    initalizeRoomList(myLayout, !savedState);

    // Join a chat room when the corresponding tab is created
    myLayout.on('tabCreated', function (tab) {
        tab
            .closeElement
            .off('click') //unbind the current click handler
            .click(function () {
                chatWindowClosed(tab, socket)
            });
    });
    addRoom('lobby', myLayout);

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


function initalizeRoomList(layout, createRoomList) {
    var newTabConfig = {
            title: 'Room List',
            type: 'component',
            componentName: 'tab',
            componentState: {
                text: '<div id="roomList">' +
                '<input class="chatEntry" id="roomListEntry" type="text">'
                + '</div>',
                name: 'Room List'
            },
            isClosable: false
        }
    ;

    //I don't think this is needed; but testing requires playing with local storage.
    if (createRoomList) {
        var ad = (layout.root.contentItems.length == 0) ? layout.root : layout.root.contentItems[0];
        ad.addChild(newTabConfig);
    }
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
    var roomListElement = $('<li>' + roomName + '</li>');

    function openChatWindow() {
        layout.root.contentItems[0].addChild(newRoom);
    }

    $('#roomList').prepend(roomListElement);
    layout.createDragSource(roomListElement, newRoom);
    roomListElement.click(openChatWindow);
}

/**------------------------------Chat Windows---------------------------------**/
function chatWindowClosed(tab, socket) {
    socket.emit('left');
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