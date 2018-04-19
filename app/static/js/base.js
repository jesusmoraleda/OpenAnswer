/**
 * Created on 4/19/18.
 */
$(document).ready(function () {
    $('#clearSavedLayout').click(function clearSavedLayout() {
        if (confirm('This will delete your chat layout and only reopen lobby, are you sure?')) {
            delete(window.localStorage.savedState);
            window.location.reload();
        }
    });
});