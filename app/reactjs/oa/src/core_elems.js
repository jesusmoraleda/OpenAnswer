import React from "react";
import './chat-dark.css';

function enterKeyPressed(e) {
    let code = e.keyCode || e.which;
    return code === 13
}

class Tab extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            tabType: props.tabType,                    //'room', 'question', 'list', FIXME - think of better types
            title: props.title.toLowerCase(),          // tab title
            items: props.items || [],                  // tab contents
            textValue: props.textValue || '',          // textbox value
            inputPlaceholder: props.inputPlaceholder,  // textbox placeholder
        };
        this.handleTextChange = this.handleTextChange.bind(this);
        this.handleKeyPress = this.handleKeyPress.bind(this);
        this.setItems = this.setItems.bind(this); // shortcut to setting all items (used by room list)
        this.renderItem = this.renderItem.bind(this);
        this.append = this.append.bind(this);
        this.glEventHub = props.glEventHub;
        this.glEventHub.on('append', this.append);
        this.glEventHub.on('setItems', this.setItems);
    }

    append(item) {
        if (item.title === this.state.title){
            this.setState({items: this.state.items.concat(item)});
        }
    }

    setItems(title, items) {
        if (title === this.state.title) {
            this.setState({items: items});
        }
    }

    renderItem(item) {
        let renderer = null;
        switch (this.state.tabType) {
            case 'room':
                renderer = this.renderMsg;
                break;
            default:
                renderer = this.renderDefault;
                break;
        }
        return renderer(item);
    }

    renderMsg(item) {
        return (
            <li id="chatMessage"
                key={item.key}
                timestamp={item.timestamp}>
                <div id="chat_username" user={item.user}>
                    {item.user}:
                </div> {item.msg}
                <div id="timestamp"></div>
            </li>
        );
    }

    renderDefault(item){
        return <li key={item.key}>{item.val}</li>;
    }

    handleTextChange(e) {
        const new_val = e.target.value;
        this.setState({textValue: new_val});
    }

    handleKeyPress(e) {
        if(enterKeyPressed(e) && this.state.textValue!=='') {
            const txt = this.state.textValue;
            this.setState({textValue: ''});
            return this.glEventHub.emit('submit', this.state.tabType, this.state.title, txt);
        }
    }

    render() {
        return (
            <div className="chatWindow">
                <ul className="chatMessages">
                    {this.state.items.map(this.renderItem)}
                </ul>
                <div className="scrollTo"></div>
                <input
                    className="chatEntry"
                    key={"inputBox_" + this.state.title}
                    id={this.state.title}
                    type="text" value={this.state.textValue}
                    onKeyPress={this.handleKeyPress}
                    onChange={this.handleTextChange}
                />
            </div>
        )
    }
}

export {enterKeyPressed, Tab}
