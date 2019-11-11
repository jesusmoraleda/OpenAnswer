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
        this.chatSocket = io(
            window.location.protocol + '//' + document.domain + ':' + window.location.port + '/chat'
        );
        this.saveLayout = this.saveLayout.bind(this);
        this.join = this.join.bind(this);
        this.send = this.send.bind(this);
        this.componentCreated = this.componentCreated.bind(this);
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
        console.log('Joining ' + data.room);
    }

    send(data) {
        console.log('Sending ' + data.msg + ' to ' + data.room);
    }

    componentCreated(e) {
        const config = e.config;
        if (config.component === 'chat-window') {
            console.log('Joining ' + config.title);
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
                    title: 'ReactJS',
                    type: 'react-component',
                    component: 'chat-window',
                    props: {
                        items: ['sample message'],
                        title: 'reactjs',
                        textValue: 'reactjs msg in progress',
                        inputPlaceholder: 'Send a message...',
                    },
                }, {
                    title: 'Lobby',
                    type: 'react-component',
                    component: 'chat-window',
                    props: {
                        items: ['sample message'],
                        title: 'lobby',
                        textValue: '',
                        inputPlaceholder: 'Send a message...',
                    },
                }, ]
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
export default ChatLayout;

