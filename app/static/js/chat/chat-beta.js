/**
 * Created on 6/5/17.
 */

$(document).ready(function() {
    var conv_board = $('#conv_board');
    var room_name_area = $('#room_name');
    var rooms = {};

    room_name_area.keypress(function (e) {
        var code = e.keyCode || e.which;
        if (code==13) {
            var room_name = room_name_area.val();
            var tile = ConversationTile(room_name);
            conv_board.append(tile.conversation_tile);
            rooms[room_name] = tile.socket;
        }
    });

    $('#conv_board').on('keypress', '.conv_input', function (e) {
        var code = e.keyCode || e.which;
        if (code==13) {
            var room = this.getAttribute('room');
            var socket = rooms[room];
            socket.emit(
                'sent', {msg: $(this).val(), room: room, sid: socket.id}
            );
        }
    });
});

function ConversationTile(room_name) {
    this.conversation_tile =
        "<div class='conv_tile'>" +
            room_name +
            "<ul class='conv_messages'>" +
            "</ul>" +
            "<input type='text' class='conv_input' room='" + room_name + "'>" +
        "</div>";

    var socket = io.connect(location.protocol + '//' + document.domain + ':' + location.port + '/chat');

    socket.on('connect', function () {
        socket.emit('joined', {room: room_name});
    });

    socket.on('status', function (data) {
        console.log(data);
    });

    socket.on('received', function (data) {
        var ts = '<div id="timestamp">' + $.timeago(new Date(data.timestamp));
        $('.conv_messages').append($('<li>').html(
            data.username + ': ' + data.content + ' | '+ ts + '</li>'
        ));
    });

    this.socket = socket;
    return this;
}