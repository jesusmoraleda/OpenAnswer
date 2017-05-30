//https://github.com/accursoft/caret
(function($) {
  $.fn.caret = function(pos) {
    var target = this[0];
    var isContentEditable = target && target.contentEditable === 'true';
    if (arguments.length == 0) {
      //get
      if (target) {
        //HTML5
        if (window.getSelection) {
          //contenteditable
          if (isContentEditable) {
            target.focus();
            var range1 = window.getSelection().getRangeAt(0),
                range2 = range1.cloneRange();
            range2.selectNodeContents(target);
            range2.setEnd(range1.endContainer, range1.endOffset);
            return range2.toString().length;
          }
          //textarea
          return target.selectionStart;
        }
        //IE<9
        if (document.selection) {
          target.focus();
          //contenteditable
          if (isContentEditable) {
              var range1 = document.selection.createRange(),
                  range2 = document.body.createTextRange();
              range2.moveToElementText(target);
              range2.setEndPoint('EndToEnd', range1);
              return range2.text.length;
          }
          //textarea
          var pos = 0,
              range = target.createTextRange(),
              range2 = document.selection.createRange().duplicate(),
              bookmark = range2.getBookmark();
          range.moveToBookmark(bookmark);
          while (range.moveStart('character', -1) !== 0) pos++;
          return pos;
        }
        // Addition for jsdom support
        if (target.selectionStart)
          return target.selectionStart;
      }
      //not supported
      return;
    }
    //set
    if (target) {
      if (pos == -1)
        pos = this[isContentEditable? 'text' : 'val']().length;
      //HTML5
      if (window.getSelection) {
        //contenteditable
        if (isContentEditable) {
          target.focus();
          window.getSelection().collapse(target.firstChild, pos);
        }
        //textarea
        else
          target.setSelectionRange(pos, pos);
      }
      //IE<9
      else if (document.body.createTextRange) {
        if (isContentEditable) {
          var range = document.body.createTextRange();
          range.moveToElementText(target);
          range.moveStart('character', pos);
          range.collapse(true);
          range.select();
        } else {
          var range = target.createTextRange();
          range.move('character', pos);
          range.select();
        }
      }
      if (!isContentEditable)
        target.focus();
    }
    return this;
  }

https://gist.githubusercontent.com/mathiasbynens/326491/raw/3280890f84372311c18e0e75e6631540b9639f67/jquery.insertAtCaret.js
  $.fn.insertAtCaret = function(myValue) {
      return this.each(function() {
          var me = this;
          if (document.selection) { // IE
              me.focus();
              sel = document.selection.createRange();
              sel.text = myValue;
              me.focus();
          } else if (me.selectionStart || me.selectionStart == '0') { // Real browsers
              var startPos = me.selectionStart, endPos = me.selectionEnd, scrollTop = me.scrollTop;
              me.value = me.value.substring(0, startPos) + myValue + me.value.substring(endPos, me.value.length);
              me.focus();
              me.selectionStart = startPos + myValue.length;
              me.selectionEnd = startPos + myValue.length;
              me.scrollTop = scrollTop;
          } else {
              me.value += myValue;
              me.focus();
          }
      });
  };
})(jQuery);