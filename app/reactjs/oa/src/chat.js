import React from 'react';
import ReactDOM from "react-dom";
import GoldenLayout from 'golden-layout';
import {Tab} from './core_elems.js';
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
            openRooms: [],
        };
        this.componentCreated = this.componentCreated.bind(this);
        this.saveLayout = this.saveLayout.bind(this);
        this.received = this.received.bind(this);
        this.submit = this.submit.bind(this);
        const loc = window.location;
        this.socket = io(`${loc.protocol}//${document.domain}:${loc.port}/chat`, {'reconnection': false,});
        this.socket.on('received', this.received);
    }

    componentDidMount() {
        // Lazily initialize Golden Layout
        let layout = new GoldenLayout(this.state.config);
        layout.registerComponent('list', Tab);
        layout.registerComponent('room', Tab);
        layout.on('componentCreated', this.componentCreated);
        layout.on('stateChanged', this.saveLayout);
        layout.eventHub.on('submit', this.submit);
        layout.init();
        this.setState({layout: layout});
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

    received(item) {
        const ts = item.timestamp;
        const user = item.username;
        const title = item.room;
        const key = `${title}_${user}_${ts.toString()}`;
        return this.state.layout.eventHub.emit(
            'append',
            {title: title, key: key, msg: item.content, user: user, timestamp: ts}
        );
    }

    submit(type, title, txt){
        switch (type) {
            case "room":
                return this.socket.emit('sent', {msg: txt, room: title, sid: this.socket.id});
            case "list":
                const roomName = txt.toLowerCase();
                //should be removed when we add "addChild" for golden layout
                const newRoom = {
                    type: 'react-component',
                    component: 'room',
                    title: roomName,
                    props: {
                        tabType: 'room',
                        title: roomName,
                        items: [],
                        inputPlaceholder: `Message ${roomName}...`,
                    },
                };
                this.state.layout.root.contentItems[0].addChild(newRoom);
        }
    }

    componentCreated(e) {
        const config = e.config;
        const ts = Date.now();
        switch (config.component) {
            case 'room':
                const room = config.title.toLowerCase();
                fetch(
                    `../messages/${room}`
                ).then(
                    data => {return data.json()}
                ).then(
                    jsonData => {
                        this.state.layout.eventHub.emit(
                            'setItems', room,
                            // Generate a list of messages our ui understands
                            jsonData.messages.map((msg) => {
                                return {
                                    title: msg.room,
                                    key: `${msg.room}_${msg.username}_${msg.timestamp.toString()}`,
                                    msg: msg.content,
                                    user: msg.username,
                                    timestamp: msg.timestamp
                                }
                            }).reverse()
                        )
                    }
                ).catch(
                    () => {console.log(`Unable to load messages for ${room}`)}
                );
                this.socket.emit('joined', {room: room});
                let openRooms = this.state.openRooms;
                openRooms.push({key: `${room}_${ts.toString()}`, val: room});
                this.setState({openRooms: openRooms});
                this.state.layout.eventHub.emit('setItems', 'room list', this.state.openRooms);
                break;
            case 'list':
                // maybe subscribe to question list here
                break;
        }
    }

    render() {
        return <div />
    }

    getConfig() {
        // This interferes with the savedLayout we use on the functional chat
        let storedConfig = localStorage.getItem('savedReactLayout');
        const config = storedConfig? JSON.parse(storedConfig) : {
            content: [{
                type: 'row',
                content: [{
                    title: 'Room List',
                    type: 'react-component',
                    component: 'list',
                    props: {
                        tabType: 'list',
                        items: [],
                        title: 'Room List',
                        inputPlaceholder: 'Create or join room...',
                    },
                }, {
                    type: 'react-component',
                    component: 'room',
                    title: 'lobby',
                    props: {
                        tabType: 'room',
                        items: [],
                        title: 'lobby',
                        inputPlaceholder: 'Message lobby...',
                    },
                }]
            }]
        };
        return config;
    }
}

window.React = React;
window.ReactDOM = ReactDOM;
export {ChatLayout};

