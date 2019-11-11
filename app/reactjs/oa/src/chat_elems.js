import React from "react";
import PropTypes from 'prop-types';
import {InputField} from "./core_elems";
import io from 'socket.io-client';

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
        /** Placeholder text for the input at the bottom of each tab */
        inputPlaceholder: PropTypes.string,
    };

    constructor(props) {
        super(props);
        this.state = {
            items: props.items,
            isChatWindow: !(props.title === 'Room List'),
            title: props.title.toLowerCase(),
            inputPlaceholder: props.inputPlaceholder,
        };
        this.onSubmit = this.onSubmit.bind(this);
        this.send = this.send.bind(this);
        this.join = this.join.bind(this);
        // FIXME: We should not be creating sockets per chat window. Move this to chat.js somehow.
        console.log('creating a socket');
        this.chatSocket = io(window.location.protocol + '//' + document.domain + ':' + window.location.port + '/chat');
    }

    renderItem(item) {
        return <div id={item} key={item}>{item}</div>
    }

    onSubmit(e) {
        return this.state.isChatWindow? this.send(e) : this.join(e);
    }

    join(e) {
        console.log('Joining ' + e);
        return this.chatSocket.emit('joined', {room: e});
    }

    send(msg) {
        // FIXME:
        // Why am I connected to lobby? Don't join "Lobby" in /reactjs/ ui, just send a message.
        // If you have the working front end open, the message will go through. Why??
        // I suspect you can always send, but you can't receive unless you "join" a room. Test this.
        // How come this hasn't come up before? Why don't we know this already?
        const roomName = this.state.title;
        console.log('Sent ' + msg + ' to ' + roomName);
        return this.chatSocket.emit('sent', {
            room: this.state.title,
            msg: msg,
            sid: this.chatSocket.id,
        });
    }

    render() {
        return (
            <div>
                <ul className={this.state.title} key="roomListContainer">
                    {this.state.items.map(this.renderItem)}
                </ul>
                <InputField
                    value=''
                    name={'input-'+this.state.title}
                    placeholder={this.state.inputPlaceholder}
                    onSubmit={this.onSubmit} />
            </div>
        )
    }
}

export {Tab}