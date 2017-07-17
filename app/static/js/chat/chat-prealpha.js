$(document).ready(function () {
    var socket = io.connect(location.protocol + '//' + document.domain + ':' + location.port + '/chat');

    socket.on('received', function (data) {
        $('#' + data.room + '.chatWindow .chatMessages').append('<li> ' + data.username + ': ' + data.content + '</li>')
    });

    var layoutContainer = $('#layoutContainer');

    var myLayout = new window.GoldenLayout({
        settings:{showPopoutIcon: false},
        content: []}, layoutContainer);

    myLayout.registerComponent('tab', function (container, state) {
        container.getElement().html(state.text);
    });

    // Join a chat room when the corresponding tab is created
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
    initalizeRoomList(myLayout);
    addRoom('lobby', myLayout);
    addRoom('lobby2', myLayout);

    var roomEntry = $('#roomList #roomListEntry');

    roomEntry.keypress(function (e) {
        var code = e.keyCode || e.which;
        if (code === 13) {
            var roomName = $.trim(roomEntry.val());
            roomEntry.val('');
            if (roomName !== '' && roomName !== 'Room List') {
                addRoom(roomName, myLayout);
            }
        }
    })

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

});


function initalizeRoomList(layout) {
    var newTabConfig = {
        title: 'Room List',
        type: 'component',
        componentName: 'tab',
        componentState: {
            text: '<div id="roomList">' +
            '<input class="chatEntry" id="roomListEntry" type="text">'
            + '</div>'
        },
        isClosable: false

}
    ;
    layout.root.addChild(newTabConfig);
}

function addRoom(roomName, layout) {
    var newRoom = {
        title: roomName,
        type: 'component',
        componentName: 'tab',
        componentState: {text: getChatRoomTemplate(roomName)}
    }
    var listElement = $('<li>' + roomName + '</li>');

    function openChatWindow() {
        layout.root.contentItems[0].addChild(newRoom);
    }

    $('#roomList').append(listElement);
    layout.createDragSource(listElement, newRoom);
    listElement.click(openChatWindow);
}
/**------------------------------Chat Windows---------------------------------**/
function chatWindowClosed(tab, socket) {
    socket.emit('left');
    tab.contentItem.remove();
}

function getTabTemplate(tabName) {
    var tabHtml =
        '<ul class="tab" id="${tabName}"></ul>';

    return tabHtml;
}

function getChatRoomTemplate(roomName) {
    var chatWindowHtml =
        '<div class="chatWindow" id="' + roomName + '">' +
        '<ul class="chatMessages">' +
        '</ul>' +
        '<input class="chatEntry" id="' + roomName + '" ' + 'type="text">' +
        '</div>';
    return chatWindowHtml;
}