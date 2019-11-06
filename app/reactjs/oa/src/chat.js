import React from 'react';
import ReactDOM from "react-dom";
import GoldenLayout from 'golden-layout';
import "golden-layout/src/css/goldenlayout-base.css";
import "golden-layout/src/css/goldenlayout-dark-theme.css";

function getRooms(name) {
    return ['lobby', 'test', name]
}


class RoomList extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            rooms: getRooms(props.name),
            name: props.name,
        };
    }

    render() {
        return [
            <ul className="roomList" key="roomListContainer">
                {this.state.rooms.map(getRoomListElement)}
            </ul>,
            <input className="enterRoom" key="roomCreateTextbox"
                   id="roomList"
                   type="text"
                   placeholder="Create or join room..."></input>
        ]
    }

}

function getRoomListElement(roomName) {
    return <div id={roomName} key={roomName}>{roomName}</div>
}

class ChatLayout extends React.PureComponent {
    componentDidMount(){
        var config = {
            settings: {showPopoutIcon: false},
            content: [{
                type: 'row',
                //isClosable: false,
                content: [{
                    title: 'Room List',
                    type: 'react-component',
                    component: 'chat-window',
                    props: {name: 'Room List'}
                },{
                    title: 'Room List1',
                    type: 'react-component',
                    component: 'chat-window',
                    props: {name: 'Room List1'}
                }]
            }]
        };
        const instance = new GoldenLayout(config);
        instance.registerComponent('chat-window', RoomList);
        instance.init();
    }

    render() {
        return <div />
    }
}
window.React = React;
window.ReactDOM = ReactDOM;
export default ChatLayout;

