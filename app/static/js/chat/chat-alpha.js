$(document).ready(function() {
    var socket = io.connect(location.protocol + '//' + document.domain + ':' + location.port + '/chat');
    socket.on('received', function(data){console.log(data)});
    var config = {
        content: [{
            type: 'row',
            content: [{
                type:'component',
                componentName: 'room',
                componentState: { text: 'Messages' }
            }]
        }]
    };

    var myLayout = new window.GoldenLayout( config, $('#layoutContainer') );

    myLayout.registerComponent( 'room', function( container, state ){
        container.getElement().html( '<h2>' + state.text + '</h2>');
    });

    myLayout.init();

    addSidebarItem( myLayout, socket, 'lobby');
    addSidebarItem( myLayout, socket, 'a');
});

function addSidebarItem(layout, socket, room_name) {
    var element = $( '<li>' + room_name + '</li>' );
    $( '#sidebar' ).append( element );

   var newItemConfig = {
        title: room_name,
        type: 'component',
        componentName: 'room',
        componentState: { text: 'STRING' }
    };

    layout.createDragSource( element, newItemConfig );
    element.click(function(){
        socket.emit('joined', {room: room_name, sid: socket.id});
        layout.root.contentItems[ 0 ].addChild( newItemConfig );
    });
};