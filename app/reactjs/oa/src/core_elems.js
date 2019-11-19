import React from 'react';
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
            scrollPaused: false,                       // scroll paused
            textValue: props.textValue || '',          // textbox value
            inputPlaceholder: props.inputPlaceholder,  // textbox placeholder
            notification: null,                        // alert text for new items
        };
        // Needs to be updated immediately, putting this in state introduces lag until event is fired.
        //      also, this is a calculated field, not maintained by parent components.
        this.handleTextChange = this.handleTextChange.bind(this);
        this.handleKeyPress = this.handleKeyPress.bind(this);
        this.handleScroll = this.handleScroll.bind(this);
        this.setItems = this.setItems.bind(this); // shortcut to setting all items (used by room list)
        this.renderItem = this.renderItem.bind(this);
        this.renderMsg = this.renderMsg.bind(this);
        this.append = this.append.bind(this);
        this.contentEnd = React.createRef();
        this.scrollToBottom = this.scrollToBottom.bind(this);
        this.glEventHub = props.glEventHub;
        this.glEventHub.on('append', this.append);
        this.glEventHub.on('setItems', this.setItems);
    }

    append(item) {
        if (item.title === this.state.title){
            this.setState({items: this.state.items.concat(item)}, this.scrollToBottom);
        }
    }

    setItems(title, items) {
        if (title === this.state.title) {
            this.setState({items: items}, this.scrollToBottom);
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
                timestamp={item.timestamp}
                ref={this.contentEnd}       // make the last item the anchor for scrolling to the bottom
            >
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
        // if (enterKeyPressed(e)) {this.notify();} // uncomment and hit enter to test notifications
        if(enterKeyPressed(e) && this.state.textValue!=='') {
            const txt = this.state.textValue;
            this.setState({textValue: '', scrollPaused: false, notification: null});
            return this.glEventHub.emit('submit', this.state.tabType, this.state.title, txt);
        }
    }

    handleScroll(e) {
        const atBottom = (e.target.scrollHeight - Math.ceil(e.target.scrollTop) === e.target.clientHeight);
        const scrolledUp = !atBottom;
        if (scrolledUp !== this.state.scrollPaused) {
            this.setState({scrollPaused: scrolledUp});
        }
        if (atBottom) {
            this.setState({notification: null});
        }
    }

    scrollToBottom(force=false) {
        if (force) {
            // Force scroll down if user clicks on new messages notification
            this.setState({scrollPaused: false, notification: null});
            this.contentEnd.current.scrollIntoView({behavior: 'smooth'});
        }
        else if (this.contentEnd.current && !this.state.scrollPaused) {
            // https://stackoverflow.com/questions/57214373/scrollintoview-using-smooth-function-on-multiple-elements-in-chrome
            // Scrolling multiple components with 'smooth' behavior is impossible, because why would it be ugh.
            this.contentEnd.current.scrollIntoView({behavior: 'auto'});
        }
        else if (this.state.scrollPaused && !this.state.notification) {
            this.setState({notification: 'New messages'})
        }
    }

    notify() {
        console.log('new messages');
    }

    render() {
        return (
            <div className="chatWindow">
                <ul className="chatMessages" onScroll={this.handleScroll}>
                    {this.state.items.map(this.renderItem)}
                </ul>
                {this.state.scrollPaused && this.state.notification &&
                 <button className='scrollDownIndicator'
                         onClick={() => {this.scrollToBottom(true)}}>
                    {this.state.notification}
                </button>}
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
