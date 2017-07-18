$(document).ready(function () {
    var socket = io.connect(location.protocol + '//' + document.domain + ':' + location.port + '/chat');

    socket.on('received', function (data) {
        $('#' + data.room + '.chatWindow .chatMessages').append('<li> ' + data.username + ': ' + data.content + '</li>')
    });
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
    })

    myLayout.registerComponent('tab', function (container, state) {
        container.getElement().html(state.text);
    });
    myLayout.init();
    if (savedState === null) {
        initalizeRoomList(myLayout);
    }
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

    //I don't think this is needed; but testing requires playing with local storage.
    var ad = (layout.root.contentItems.length == 0) ? layout.root : layout.root.contentItems[0];
    ad.addChild(newTabConfig);
}

function addRoom(roomName, layout) {
    var newRoom = {
        title: roomName,
        type: 'component',
        componentName: 'tab',
        componentState: {text: getChatRoomTemplate(roomName)}
    }
    var roomListElement = $('<li>' + roomName + '</li>');

    function openChatWindow() {
        layout.root.contentItems[0].addChild(newRoom);
    }

    $('#roomList').append(roomListElement);
    layout.createDragSource(roomListElement, newRoom);
    roomListElement.click(openChatWindow);
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