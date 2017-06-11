$(document).ready(function () {
    var socket = io.connect(location.protocol + '//' + document.domain + ':' + location.port + '/chat');

    socket.on('received', function (data) {
        console.log(data);
        $('#' + data.room + '.chatWindow .chatMessages').append('<li> ' + data.username + ': ' + data.content + '</li>')
    });

    var myLayout = new window.GoldenLayout({content: []}, $('#layoutContainer'));

    myLayout.registerComponent('room', function (container, state) {
        container.getElement().html(state.text);
    });

    myLayout.on('tabCreated', function (tab) {
        console.log('tab created', tab);
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
        if (code == 13) {
            var roomName = $.trim(roomEntry.val());
            roomEntry.val('');
            if (roomName != '') {
                addSidebarItem(myLayout, roomName)
            }
        }
    });


});

/** @param {window.GoldenLayout} layout Layout into which we will be dropping items from roomList**/
/** @param {String} roomName The name of the room we're joining**/
function addSidebarItem(layout, roomName) {
    var element = $('<li>' + roomName + '</li>');
    $('#roomList').append(element);

    var newItemConfig = {
        title: roomName,
        type: 'component',
        componentName: 'room',
        componentState: {text: getChatWindowTemplate(roomName)}
    };

    // Enable dragging and dropping the room, as well as opening it on click
    layout.createDragSource(element, newItemConfig);
    element.click(function () {
        var addTo = (layout.root.contentItems.length == 0) ? layout.root : layout.root.contentItems[0];
        addTo.addChild(newItemConfig);
    });
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
    return chatWindowHtml
}