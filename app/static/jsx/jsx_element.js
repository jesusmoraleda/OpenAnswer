'use strict';

const e = React.createElement;

class TextBox extends React.Component {
    constructor(props) {
        super(props);
        this.state = { value: '' };

        this.handleChange = this.handleChange.bind(this);
        this.handleSubmit = this.handleSubmit.bind(this);
        this.handleKeyDown = this.handleKeyDown.bind(this);
    }

    handleChange(event) {
        console.log('changed to '+event.target.value);
        this.setState({value: event.target.value});
    };

    handleSubmit(event) {
        alert('a name was submitted ' + this.state.value);
        event.preventDefault();
    };

    handleKeyDown(event) {
        if (event.key === 'Enter') {
            this.handleSubmit(event);
        }
    }

    render() {
        return (
            <input type="text"
                   value={this.state.value}
                   onChange={this.handleChange}
                   onKeyDown={this.handleKeyDown}
                   placeholder='This is a jsx element'
            />
        );
    }
}

const domContainer = document.querySelector('#my_jsx_element_container');
ReactDOM.render(e(TextBox), domContainer);