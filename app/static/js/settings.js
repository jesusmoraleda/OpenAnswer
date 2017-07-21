$(document).ready(function () {
    $('#clearSavedLayout').click(function clearSavedLayout() {
        delete(window.localStorage.savedState);
    });

});
