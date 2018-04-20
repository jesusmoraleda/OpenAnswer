function getChatRoomTemplate(roomName) {
    var chatWindowHtml =
        '<div class="chatWindow" id="' + roomName + '">' +
            '<ul class="chatMessages">' +
            '</ul>' +
            '<input class="chatEntry" ' +
                    'id="' + roomName + '" ' +
                    'type="text" ' +
                    'placeholder="Message '+roomName+'...">' +
        '</div>';
    return chatWindowHtml;
}

function getMessageTemplate(msg, markdown) {
    var sender_username = msg.username;
    var messageTemplate =
        '<li id="chatMessage" timestamp="' + msg.timestamp + '">' +
            '<div id="chat_username" user="' + sender_username +'">' + sender_username + ':</div> ' +
            addYoutube(
                markdown.renderInline(msg.content)
            ) +
        '<div id="timestamp"></div></li>';
    return messageTemplate;
}

function getRoomListElement(roomName) {
    var roomListElement =
        '<button class="btn btn-dark btn-sm"' +
                'type="button"' +
                'data-toggle="collapse"' +
                'data-target="#chatContent-' + roomName + '">' +
            roomName +
        '<i class="fas fa-chevron-circle-down"></i>' +
        '</button>' +
        '<div id="chatContent-' + roomName + '" class="collapse in">' +
            'Online:' +
        '</div>';
    return roomListElement
}
