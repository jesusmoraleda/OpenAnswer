import React from "react";
import PropTypes from 'prop-types';
import {enterKeyPressed} from "./core_elems";

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
        this.state = {
            items: props.items,
            title: props.title.toLowerCase(),
            textValue: props.textValue || '',
            inputPlaceholder: props.inputPlaceholder,
        };
        this.handleTextChange = this.handleTextChange.bind(this);
        this.handleKeyPress = this.handleKeyPress.bind(this);
        this.send = this.send.bind(this);
        this.join = this.join.bind(this);
        this.receive = this.receive.bind(this);
        this.glEventHub = props.glEventHub;
        this.glEventHub.on('receive', this.receive);
        this.isChatWindow = !(props.title === 'Room List');
    }

    renderItem(item) {
        return <div id={item} key={item}>{item}</div>
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
            console.log('chat tab received');
            console.log(data);
        }
    }

    join(room) {
        return this.glEventHub.emit('join', {room: room});
    }

    send(msg) {
        return this.glEventHub.emit('send', {msg: msg, room: this.state.title});
    }

    render() {
        return (
            <div>
                <ul className={this.state.title} key="roomListContainer">
                    {this.state.items.map(this.renderItem)}
                </ul>
                <input
                    className=".inputBox"
                    key={"inputBox_" + this.state.title}
                    id={"inputBox_" + this.state.title}
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