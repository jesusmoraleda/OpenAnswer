import React from "react";
import PropTypes from 'prop-types';
import {InputField} from "./core_elems";


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
            title: props.title,
            inputPlaceholder: props.inputPlaceholder,
        };
        this.onSubmit = this.onSubmit.bind(this);
        this.send = this.send.bind(this);
    }

    renderItem(item) {
        return <div id={item} key={item}>{item}</div>
    }

    onSubmit(e) {
        const joining = (this.state.title === 'Room List');
        return joining? this.join(e) : this.send(e);
    }

    join(e) {
        console.log('Joining ' + e);
    }

    send(e) {
        console.log('Sent ' + e + ' to ' + this.state.title);
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