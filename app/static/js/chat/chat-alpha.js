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

    addSidebarItem(myLayout, 'lobby', true);
});


function addSidebarItem(layout, roomName, autoOpen) {
    var element = $('<li>' + roomName + '</li>');
    $('#roomList').append(element);

    var newItemConfig = {
        title: roomName,
        type: 'component',
        componentName: 'room',
        componentState: {text: getChatWindowTemplate(roomName)}
    };

    function openChatWindow() {
        var addTo = (layout.root.contentItems.length == 0) ? layout.root : layout.root.contentItems[0];
        addTo.addChild(newItemConfig);
    }

    // Enable dragging and dropping the room, as well as opening it on click
    layout.createDragSource(element, newItemConfig);
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
            '<input class="chatEntry" id="' + roomName + '" ' + 'type="text">' +
        '</div>';
    return chatWindowHtml;
}