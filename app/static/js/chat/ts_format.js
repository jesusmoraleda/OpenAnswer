/**
 * Created on 6/5/17.
 */

function show_timestamp() {
    var ts = $.timeago(new Date(this.getAttribute('timestamp')));
    var ts_div = $(this).children("#timestamp");
    ts_div.text(ts);
    ts_div.css('display', 'inline-block');
}

function hide_timestamp() {
    $(this).children("#timestamp").css('display', 'none');
}