$(document).ready(function () {
    var socket = io.connect(location.protocol + '//' + document.domain + ':' + location.port + '/chat');

    socket.on('received', function (data) {
        $('#' + data.room + '.chatWindow .chatMessages').append('<li> ' + data.username + ': ' + data.content + '</li>')
    });

    var layoutContainer = $('#layoutContainer');

    var myLayout = new window.GoldenLayout({content: []}, layoutContainer);

    myLayout.registerComponent('room', function (container, state) {
        container.getElement().html(state.text);
    });

    myLayout.registerComponent('roomList', function (container, state) {
        container.getElement().html(state.text);
    });

    myLayout.on('tabCreated', function (tab) {
        socket.emit('joined', {room: tab.titleElement[0].textContent});
        tab
            .closeElement
            .off('click') //unbind the current click handler
            .click(function () {
                chatWindowClosed(tab, socket)
            });
    });

    myLayout.init();

    var roomEntry = $('#sidebar #roomEntry');

    roomEntry.keypress(function (e) {
        var code = e.keyCode || e.which;
        if (code === 13) {
            var roomName = $.trim(roomEntry.val());
            roomEntry.val('');
            if (roomName !== '') {
                addSidebarItem(myLayout, roomName, true);
            }
        }
    });

    layoutContainer.on('keypress', '.chatEntry', function (e) {
        var code = e.keyCode || e.which;
        if (code === 13) {
            var msg = $.trim($(this).val());
            if (msg !== '') {
                socket.emit('sent', {msg: $(this).val(), room: this.id, sid: socket.id});
                this.value = '';
            }
        }
    });
    addRoomList(myLayout);
    addSidebarItem(myLayout, 'lobby', true);

});

function addRoomList(layout) {
    var newRoomListConfig = {
        title: 'Rooms',
        type: 'component',
        componentName: 'roomList',
        componentState: {text: getRoomListTemplate()}
    };
    layout.root.addChild(newRoomListConfig);
}

function addSidebarItem(layout, roomName, autoOpen) {
    var element = $('<li>' + roomName + '</li>');
    $('#roomList').append(element);

    var newRoomConfig = {
        title: roomName,
        type: 'component',
        componentName: 'room',
        componentState: {text: getChatWindowTemplate(roomName)}
    };


    function openChatWindow() {
        var addTo = layout.root.contentItems[0];
        addTo.addChild(newRoomConfig);
    }

    // Enable dragging and dropping the room, as well as opening it on click
    layout.createDragSource(element, newRoomConfig);
    element.click(openChatWindow);

    if (autoOpen) {
        openChatWindow();
    }
}


/**------------------------------Chat Windows---------------------------------**/
function chatWindowClosed(tab, socket) {
    socket.emit('left');
    tab.contentItem.remove();
}

function getChatWindowTemplate(roomName) {
    var chatWindowHtml =
        '<div class="chatWindow" id="' + roomName + '">' +
        '<ul class="chatMessages">' +
        '</ul>' +
        '</div>';
    return chatWindowHtml;
}

function getRoomListTemplate() {
    return '<ul class="roomList"><li>lobby</li><li>yolo</li><li>yolo2</li></ul>';
}