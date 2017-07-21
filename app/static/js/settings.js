$(document).ready(function () {
    $('#clearSavedLayout').click(function clearSavedLayout() {
        delete(window.localStorage.savedState);
    });

    $('#styleSheetChoice').change(function storeStyleSheet() {
        localStorage.setItem('goldenLayoutTheme', this.value);
    });
});
