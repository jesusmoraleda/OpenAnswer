import React from 'react';
import ReactDOM from "react-dom";
import GoldenLayout from 'golden-layout';
import {InputField} from './core_elems.js';
import "golden-layout/src/css/goldenlayout-base.css";
import "golden-layout/src/css/goldenlayout-dark-theme.css";


class RoomList extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            rooms: ['lobby'],
            name: props.name,
        };
    }

    joinRoom(roomName) {
        console.log('Would join '+roomName);
    }

    render() {
        return (
            <div>
                <ul className="roomList" key="roomListContainer">
                    {this.state.rooms.map(getRoomListElement)}
                </ul>
                <InputField
                    value='test'
                    name={this.name}
                    placeholder='Create or join room...'
                    onSubmit={this.joinRoom} />
            </div>
        )
    }
}

function getRoomListElement(roomName) {
    return <div id={roomName} key={roomName}>{roomName}</div>
}

class ChatLayout extends React.PureComponent {
    componentDidMount(){
        let config = {
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

