import React from "react";


class InputField extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            value: props.value,
            name: props.name,
            placeholder: props.placeholder,
            onSubmit: props.onSubmit,
        };

        this.handleChange = this.handleChange.bind(this);
        this.keyPress = this.keyPress.bind(this);
    }

    handleChange(e) {
        const new_value = e.target.value;
        this.setState({value: new_value})
    }

    keyPress(e) {
        if(enterKeyPressed(e)) {
            return this.state.onSubmit(this.state.value);
        }
    }

    render() {
        return (
            <input
                className=".inputBox"
                key={"inputBox_" + this.state.name}
                id={this.state.name}
                type="text" value={this.state.value}
                placeholder={this.state.placeholder}
                onKeyPress={this.keyPress}
                onChange={this.handleChange}
            />
        )
    }
}

function enterKeyPressed(e) {
    let code = e.keyCode || e.which;
    return code === 13
}


export {InputField}
