$(document).ready(function() {
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

    addMenuItem( myLayout, 'Some room', 'Messages from another room' );
    addMenuItem( myLayout, 'Some question', 'Question details' );
});

function addMenuItem( layout, title, text ) {
    var element = $( '<li>' + text + '</li>' );
    $( '#menuContainer' ).append( element );

   var newItemConfig = {
        title: title,
        type: 'component',
        componentName: 'room',
        componentState: { text: text }
    };

    layout.createDragSource( element, newItemConfig );
};