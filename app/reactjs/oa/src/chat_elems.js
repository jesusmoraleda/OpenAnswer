import React from "react";
import PropTypes from 'prop-types';
import {enterKeyPressed} from "./core_elems";
import './chat-dark.css';

/** A Tab in our Layout - can be used for (and not limited to)
 *   conversations
 *   questions
 *   room list
 *   question list
 */
class Tab extends React.Component {
    static propTypes = {
        /** Tab contents will be populated from these items (e.g. messages, replies, etc.) */
        items: PropTypes.array,
        /** Tab title to be displayed in the golden layout tab */
        title: PropTypes.string,
        /** Contents of the textbox at the bottom of the chat tab (we may be able to use this to restore the items) */
        textValue: PropTypes.string,
        /** Placeholder text for the input at the bottom of each tab */
        inputPlaceholder: PropTypes.string,
    };

    constructor(props) {
        super(props);
        this.isChatWindow = !(props.title === 'Room List');
        this.state = {
            // Don't accept items if this is a chat window - don't want to grow the cookie size.
            items: this.isChatWindow? [] : props.items,
            title: props.title.toLowerCase(),
            textValue: props.textValue || '',
            inputPlaceholder: props.inputPlaceholder,
        };
        this.handleTextChange = this.handleTextChange.bind(this);
        this.handleKeyPress = this.handleKeyPress.bind(this);
        this.send = this.send.bind(this);
        this.join = this.join.bind(this);
        this.receive = this.receive.bind(this);
        this.renderItem = this.renderItem.bind(this);
        this.glEventHub = props.glEventHub;
        this.glEventHub.on('receive', this.receive);
    }

    renderItem(msg) {
        if (!this.isChatWindow) {
            return <div id={msg} key={msg}>{msg}</div>;
        }
        const sender_username = msg.username;
        const template =
            <li id="chatMessage"
                key={msg.timestamp.toString()}
                timestamp={msg.timestamp}>
                <div id="chat_username" user={sender_username}>{sender_username}:</div> {msg.content}
                <div id="timestamp"></div>
            </li>;
        return template;
    }

    handleTextChange(e) {
        const new_value = e.target.value;
        this.setState({textValue: new_value})
    }

    handleKeyPress(e) {
        if(enterKeyPressed(e)) {
            const txt = this.state.textValue;
            this.setState({textValue: ''});
            return this.isChatWindow? this.send(txt) : this.join(txt);
        }
    }

    receive(data) {
        // Don't display messages sent to other rooms
        if (data.room === this.state.title) {
            // Can be a list on initial load: {room: lobby, messages: [{msg1}, {msg2}]}
            // Or a single message: msg1 ({room: 'lobby', content: 'content', username: 'user'})
            const msgs = data.messages;
            if (msgs) {
                // FIXME:
                // Show most recent messages at the bottom. IIRC the server reversed them for the other chat.
                // When we get rid of the other chat, remove both reversals.
                this.setState({items: msgs.reverse()});
            } else {
                this.setState({items: this.state.items.concat(data)});
            }
        }
    }

    join(room) {
        this.setState({items: this.state.items.concat(room)});
        return this.glEventHub.emit('join', {room: room});
    }

    send(msg) {
        return this.glEventHub.emit('send', {msg: msg, room: this.state.title});
    }

    render() {
        return (
            <div className="chatWindow">
                <ul className="chatMessages" key={"chatWindow_"+this.state.title}>
                    {this.state.items.map(this.renderItem)}
                </ul>
                <input
                    className="chatEntry"
                    key={"inputBox_" + this.state.title}
                    id={this.state.title}
                    type="text" value={this.state.textValue}
                    placeholder={this.state.inputPlaceholder}
                    onKeyPress={this.handleKeyPress}
                    onChange={this.handleTextChange}
                />
            </div>
        )
    }
}

export {Tab}