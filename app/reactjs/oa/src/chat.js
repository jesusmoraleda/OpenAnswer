import React from 'react';
import ReactDOM from "react-dom";
import GoldenLayout from 'golden-layout';
import {Tab} from './chat_elems.js';
import "golden-layout/src/css/goldenlayout-base.css";
import "golden-layout/src/css/goldenlayout-dark-theme.css";
import io from 'socket.io-client';

// FIXME: Pure components are immutable, and faster.
//  For a given set of props PureComponent should always return the same view
class ChatLayout extends React.Component {
    constructor(props) {
        super(props);
        let config = this.getConfig();
        this.state = {
            config: config,
            layout: null,
        };
        this.saveLayout = this.saveLayout.bind(this);
        this.join = this.join.bind(this);
        this.send = this.send.bind(this);
        this.socketReceived = this.socketReceived.bind(this);
        this.componentCreated = this.componentCreated.bind(this);
        this.loadedMessages = this.loadedMessages.bind(this);
        this.chatSocket = io(
            window.location.protocol + '//' + document.domain + ':' + window.location.port + '/chat',
            {'reconnection': false,}
        );
        this.chatSocket.on('received', this.socketReceived);
    }

    componentDidMount() {
        // Lazily initialize Golden Layout
        let layout = new GoldenLayout(this.state.config);
        layout.registerComponent('room-list', Tab);
        layout.registerComponent('chat-window', Tab);
        layout.on('stateChanged', this.saveLayout);
        layout.on('componentCreated', this.componentCreated);
        layout.eventHub.on('join', this.join);
        layout.eventHub.on('send', this.send);
        layout.init();
        this.setState({layout: layout});
    }

    join(data) {
        return this.chatSocket.emit('joined', {room: data.room});
    }

    send(data) {
        return this.chatSocket.emit('sent', {msg: data.msg, room: data.room, sid: this.chatSocket.id});
    }

    socketReceived(data) {
        return this.state.layout.eventHub.emit('receive', data);
    }

    loadedMessages(room, data) {
        return this.state.layout.eventHub.emit('receive', {room: room, messages: data});
    }

    componentCreated(e) {
        const config = e.config;
        if (config.component === 'chat-window') {
            const roomName = config.title.toLowerCase();
            fetch('../messages/' + roomName)
                .then(data => {return data.json()})
                .then(jsonData => {this.loadedMessages(roomName, jsonData.messages)});
            this.chatSocket.emit('joined', {room: roomName});
        }
    }

    render() {
        return <div />
    }

    saveLayout() {
        const layoutInstance = this.state.layout;
        if (layoutInstance) {
            this.setState({config: layoutInstance.toConfig()});
            const currentConfig = this.state.config;
            // This interferes with the savedLayout we use on the functional chat
            localStorage.setItem('savedReactLayout', JSON.stringify(currentConfig));
        }
    }

    getConfig() {
        // This interferes with the savedLayout we use on the functional chat
        let storedConfig = localStorage.getItem('savedReactLayout');
        const config = storedConfig? JSON.parse(storedConfig) : {
            settings: {showPopoutIcon: false},
            content: [{
                type: 'row',
                content: [{
                    title: 'Room List',
                    type: 'react-component',
                    component: 'room-list',
                    props: {
                        items: ['lobby'],
                        title: 'Room List',
                        inputPlaceholder: 'Create or join room...',
                    },
                }, {
                    title: 'lobby',
                    type: 'react-component',
                    component: 'chat-window',
                    props: {
                        title: 'lobby',
                        textValue: '',
                        inputPlaceholder: 'Message lobby...',
                    },
                }, {
                    title: 'reactjs',
                    type: 'react-component',
                    component: 'chat-window',
                    props: {
                        title: 'reactjs',
                        textValue: '',
                        inputPlaceholder: 'Message reactjs...',
                    },
                }]
            }]
        };
        return config;
    }
}

// class Chat extends React.Component {
//     render() {
//         return
//     }
//
//     join(room) {
//         console.log('Joined: ' + room)
//     }
//     send(message) {
//         console.log('Sent: ' + message)
//     }
// }

window.React = React;
window.ReactDOM = ReactDOM;
export {ChatLayout};

