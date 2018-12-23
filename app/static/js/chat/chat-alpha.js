$.fn.showBigImage = function(url){
	var src = this.attr('src') || url;
	if (!src) return;
	var imagelarge = $('#image_large');
	var imagecontainer = $('#large_image_container');
	imagelarge.attr('src', src);
	imagecontainer.show();
	imagelarge.show();
};

var unread = 0;

$(document).ready(function () {
    /**---------------------------IE, Y U MAKE ME DO DIS???-----------------------**/
    // Disabling the alpha chat in IE for now as we have users constantly asking us how to use the site, without realizing that it's actually broken.
    // https://stackoverflow.com/questions/9847580/how-to-detect-safari-chrome-ie-firefox-and-opera-browser
    // Internet Explorer 6-11
    var isIE = /*@cc_on!@*/false || !!document.documentMode;
    if (isIE) {
        var legacy_chat = location.protocol + '//' + document.domain + '/chat/lobby';
        $('.browser_warning')[0].innerHTML = '<h2>Unsupported browser detected.<br>' +
            '                                     Please switch to one of the following browser: Chrome, Edge, Firefox, Opera</h2>';
        return;
    }

    /**--------------------------------Notify Settings----------------------------**/
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
    
    /**-----------------------------Big Image Preview-----------------------------**/
    $('#large_image_container').click(function(){
	    $(this).hide();
	    $(this).find('#image_large').hide();
    });
    
    $(document).on('click', '#chatMessage img', function() {
	    $(this).showBigImage();
    });

    var is_visible = visibility();
    /**Disabled because cache needs to go bust**/
    // loadStoredStyleSheet();
    var open_rooms = [];
    /**--------------------------------Sockets------------------------------------**/
    var socketAdmin = io.connect(location.protocol + '//' + document.domain + ':' + location.port + '/admin');

    socketAdmin.on('all_users_announce', function(data){
        $.notify(data['message'],
                 {className: data['type'], globalPosition: 'right top', autoHide: false});
    });

    socketAdmin.on('all_users_clear_layout', function(){
        delete(window.localStorage.savedState);
        $.notify('Your layout has been cleared.',
                 {className: 'warn', globalPosition: 'right top', autoHide: false});
    });

    socketAdmin.on('all_users_reload', function(){
        window.location.reload();
    });

    var socket = io.connect(location.protocol + '//' + document.domain + ':' + location.port + '/chat');

    socket.on('connect', function () {
        $.notify('Connected to chat',
                 {className:'success', globalPosition: 'right bottom'});
    });

    socket.on('connect_error', function(error){
        $.notify('Connection failed:\n' + error,
                 {autoHide: true, globalPosition: 'right bottom', className: 'error'});
    });

    socket.on('connect_timeout', function(timeout){
        $.notify('Connection timed out:\n' + timeout,
                 {autoHide: true, globalPosition: 'right bottom', className: 'error'});
    });

    socket.on('error', function(error){
        $.notify('Error: ' + error,
                 {autoHide: true, globalPosition: 'right bottom', className: 'error'});
    });

    socket.on('disconnect', function (reason) {
        $.notify('Disconnected from chat\n' + reason,
                 {autoHide: true, globalPosition: 'right bottom', className: 'error'});
    });

    socket.on('reconnect', function (attemptNumber) {
        for (i = 0; i < open_rooms.length; i++) {
            socket.emit('joined', {room: open_rooms[i]});
        }
        $.notify('Reconnected after ' + attemptNumber + ' attempt(s)',
                 {autoHide: true, globalPosition: 'right bottom', className: 'success'});
    });

    socket.on('reconnect_attempt', function (attemptNumber) {
        $.notify('Attempting to reconnect: ' + attemptNumber + ' attempt(s)',
                 {autoHide: true, globalPosition: 'right bottom', className: 'warn'});
    });

    socket.on('reconnecting', function (attemptNumber) {
        $.notify('Reconnecting: ' + attemptNumber + ' attempt(s)',
                 {autoHide: true, globalPosition: 'right bottom', className: 'info'});
    });

    socket.on('reconnect_error', function (error) {
        $.notify('Error reconnecting:\n' + error,
                 {autoHide: true, globalPosition: 'right bottom', className: 'error'});
    });

    socket.on('reconnect_failed', function () {
        $.notify('Failed to reconnect.',
                 {autoHide: true, globalPosition: 'right bottom', className: 'error'});
    });

    socket.on('received', function (msg) {
        appendMessage(msg);
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
            //FIXME Do the div setup in JS instead of python
            roomElem.innerHTML = data.online_users.join('</br>');
        }
    });

    window.onload = function() {initGoldenLayout(socket, open_rooms)};
});

var favicon = new Favico({
    animation: 'none',
    bgColor: '#26436B'
});

/**------------------------------Golden Layout---------------------------------**/
function initGoldenLayout(socket, open_rooms) {
    var config = {
        settings: {showPopoutIcon: false},
        content: [
            {
                type: 'row',
                //isClosable: false,
                content: []
            }
        ]
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
            if (state.name !== 'Room List') {
                // Scroll down chat when a room is opened
                scrollChatToBottom(state.name, 1, true);
            }
            tab
                .closeElement
                .off('click') //unbind the current click handler
                .click(function () {
                    chatWindowClosed(tab, socket)
                });
        });
        $.getJSON('../messages/' + state.name, function (data) {
            $.each(data.messages, function (idx, msg) {
                prependMessage(msg);
            });
	    });
        socket.emit('joined', {room: state.name});
    });

    myLayout.init();

    for (i = 0; i < open_rooms.length; i++) {
        addRoom(open_rooms[i], myLayout, false);
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
                        '<div id="roomButtons" class="btn-group-vertical"></div>' +
                        '<input class="chatEntry" id="roomListEntry" type="text" placeholder="Create or Join a room...">' +
                  '</div>',
            name: 'Room List'
        },
        //isClosable: false
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

    $('#roomButtons').prepend(roomListElement);
    // layout.createDragSource(roomListElement, newRoom);
    if (openChatTab) {
        layout.root.contentItems[0].addChild(newRoom);
    }

    //Set up scroll events
    var messageContainer = getMessageContainer(roomName);

    //We start with page 1, scrolling up increments this
    messageContainer.prop('pageNo', 1);

    // FIXME: Refactor
    messageContainer.scroll(function (e) {
        messageContainer.prop('pauseScroll', false);
        var currentPage = messageContainer.prop('pageNo');
        var currentScroll = $(this).scrollTop();
        if (currentScroll < this.lastScroll) {
            messageContainer.prop('pauseScroll', true);
            // Load older messages if we reached the top
            // Don't load more than 5 pages; server only lets you go back 7 days anyway
            if (currentScroll <= 0 && messageContainer.prop('pageNo') < 5) {
                var nextPage = currentPage + 1;
                $.getJSON('../messages/' + roomName + '/' + nextPage.toString(), function (data) {
                    $.each(data.messages, function (idx, msg) {
                        $('#' + roomName + '.chatWindow .chatMessages').prepend(getMessageTemplate(msg));
                    });
                });
                messageContainer.prop('pageNo', nextPage);
            }
        }
        this.lastScroll = currentScroll;
    });
    $('.chatEntry#' + roomName).focus();
}

/**------------------------------Chat Windows---------------------------------**/
function chatWindowClosed(tab, socket) {
    var roomName = tab.contentItem.config.title;
    socket.emit('left', {room: roomName});
    tab.contentItem.remove();
    $('#chatContent-' + roomName).remove();
    $('.btn.btn-dark.btn-sm[data-target="#chatContent-' + roomName + '"]').remove();
}

function addToRoomList(e, roomEntry, layout) {
    if (enterKeyPressed(e)) {
        var roomName = $.trim(roomEntry.val());
        roomEntry.val('');
        if (roomName !== '' && roomName !== 'Room List') {
            addRoom(roomName, layout, true);
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

function appendMessage(msg) {
    $('#' + msg.room + '.chatWindow .chatMessages').append(getMessageTemplate(msg));
    renderMathJax();
    scrollChatToBottom(msg.room, 0);
}

// FIXME: Refactor
function prependMessage(msg) {
    $('#' + msg.room + '.chatWindow .chatMessages').prepend(getMessageTemplate(msg));
    renderMathJax();
    scrollChatToBottom(msg.room, 0);
}
