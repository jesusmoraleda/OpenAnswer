$(document).ready(function () {
    var socket = io.connect(location.protocol + '//' + document.domain + ':' + location.port + '/chat');

    socket.on('received', function (data) {
        console.log(data);
        $('#'+data.room+'.chatWindow .chatMessages').append('<li> ' + data.username + ': '+ data.content + '</li>')
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
            .click(function () {chatWindowClosed(tab, socket)});
    });

    myLayout.init();

    addSidebarItem(myLayout, 'lobby');
    addSidebarItem(myLayout, 'a');
});

/** @param {window.GoldenLayout} layout Layout into which we will be dropping items from sidebar**/
/** @param {String} room_name The name of the room we're joining**/
function addSidebarItem(layout, room_name) {
    var element = $('<li>' + room_name + '</li>');
    $('#sidebar').append(element);

    var newItemConfig = {
        title: room_name,
        type: 'component',
        componentName: 'room',
        componentState: {text: getChatWindowTemplate(room_name)}
    };

    // Enable dragging and dropping the room, as well as opening it on click
    layout.createDragSource(element, newItemConfig);
    element.click(function () {
        layout.root.contentItems[0].addChild(newItemConfig);
    });
};


function chatWindowClosed(tab, socket) {
    socket.emit('left', {room: tab.titleElement[0].textContent});
    tab.contentItem.remove();
};


function getChatWindowTemplate(room_name) {
    var chatWindowHtml =
        '<div class="chatWindow" id="' + room_name + '">' +
            '<ul class="chatMessages">' +
            '</ul>' +
        '</div>';

    return chatWindowHtml
};