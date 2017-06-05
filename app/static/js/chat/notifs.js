/**
 * Created on 6/4/17.
 */

// Used to set the counter
function visibility() {
    var stateKey, eventKey, keys = {
        hidden: "visibilitychange",
        webkitHidden: "webkitvisibilitychange",
        mozHidden: "mozvisibilitychange",
        msHidden: "msvisibilitychange"
    };
    for (stateKey in keys) {
        if (stateKey in document) {
            eventKey = keys[stateKey];
            break;
        }
    }
    return function (c) {
        if (c) document.addEventListener(eventKey, c);
        return !document[stateKey];
    }
}

// Stolen from https://developer.mozilla.org/en-US/docs/Web/API/notification#Alternate_example_run_on_page_load
function spawnNotification(body, icon, title) {
    var options = {
        body: body,
        icon: icon
    };
    var n = new Notification(title, options);
    setTimeout(n.close.bind(n), 3000);
}