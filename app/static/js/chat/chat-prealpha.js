$(document).ready(function () {
    var socket = io.connect(location.protocol + '//' + document.domain + ':' + location.port + '/chat');

    socket.on('received', function (data) {
        $('#' + data.room + '.chatWindow .chatMessages').append('<li> ' + data.username + ': ' + data.content + '</li>')
    });

    var layoutContainer = $('#layoutContainer');

    var myLayout = new window.GoldenLayout({content: []}, layoutContainer);

    myLayout.registerComponent('tab', function (container, state) {
        container.getElement().html(state.text);
    });

    myLayout.init();
    initalizeRoomList(myLayout);
});


function initalizeRoomList(layout) {
    var roomList = $('<ul id="roomList"></ul>');
    var element = $('<li>' + 'lobby' + '</li>');
    var element2 = $('<li>' + 'yolo' + '</li>');
    var element3 = $('<li>' + 'hedgehog' + '</li>');
    roomList.append(element);
    roomList.append(element2);
    roomList.append(element3);
    var newTabConfig = {
        title: 'Room List',
        type: 'component',
        componentName: 'tab',
        componentState: {text: roomList}
    };

    var yolo = {
        title: 'Room List',
        type: 'component',
        componentName: 'tab',
        componentState: {text: 'fuck this shit'}
    };


    layout.createDragSource(element, yolo);
    layout.createDragSource(element2, yolo);
    layout.createDragSource(element3, yolo);
    layout.root.addChild(newTabConfig);
}

/**------------------------------Chat Windows---------------------------------**/
function chatWindowClosed(tab, socket) {
    socket.emit('left');
    tab.contentItem.remove();
}

function getTabTemplate(tabName) {
    var tabHtml =
        '<ul class="tab" id="${tabName}"></ul>'
    return tabHtml;
}