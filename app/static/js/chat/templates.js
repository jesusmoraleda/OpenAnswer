/**--------------------------------Markdown------------------------------------**/
var markdown = window.markdownit({
    linkify: true
}).use(window.markdownitEmoji)
  .use(window.markdownitMathjax());
markdown.renderer.rules.emoji = function (token, idx) {
    return window.twemoji.parse(token[idx].content);
};
var defaultRender = markdown.renderer.rules.link_open || function (tokens, idx, options, env, self) {
    return self.renderToken(tokens, idx, options);
};
markdown.renderer.rules.link_open = function (tokens, idx, options, env, self) {
    // If you are sure other plugins can't add `target` - drop check below
    var aIndex = tokens[idx].attrIndex('target');
    if (aIndex < 0) {
        tokens[idx].attrPush(['target', '_blank']); // add new attribute
    } else {
        tokens[idx].attrs[aIndex][1] = '_blank';    // replace value of existing attr
    }
    // pass token to default renderer.
    return defaultRender(tokens, idx, options, env, self);
};

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

function getMessageTemplate(msg) {
    var sender_username = msg.username;
    var messageTemplate =
          '<li id="chatMessage" timestamp="' + msg.timestamp + '">' +
              '<div id="chat_username" user="' + sender_username + '">' +
                  sender_username + ':' +
              '</div> ' +
              addYoutube(markdown.renderInline(msg.content)) +
          '<div id="timestamp"></div></li>';
    return messageTemplate;
}

function getRoomListElement(roomName) {
    var roomListElement =
        '<button class="btn btn-dark btn-sm"' +
                'type="button"' +
                'data-toggle="collapse"' +
                'data-target="#chatContent-' + roomName + '">' +
            '<i class="fas fa-angle-down"></i>' + roomName +
        '</button>' +
        '<div id="chatContent-' + roomName + '" class="collapse show">' +
            'Online:' +
        '</div>';
    return roomListElement
}
