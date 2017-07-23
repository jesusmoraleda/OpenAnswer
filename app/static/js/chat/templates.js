function getChatRoomTemplate(roomName) {
    var chatWindowHtml =
        '<div class="chatWindow" id="' + roomName + '">' +
        '<ul class="chatMessages">' +
        '</ul>' +
        '<input class="chatEntry" id="' + roomName + '" ' + 'type="text">' +
        '</div>';
    return chatWindowHtml;
}

function getMessageTemplate(msg, markdown) {
    return '<li id="chatMessage" timestamp="' + msg.timestamp + '">' +
        msg.username + ': ' + markdown.renderInline(msg.content) +
        '<div id="timestamp"></div></li>'
}