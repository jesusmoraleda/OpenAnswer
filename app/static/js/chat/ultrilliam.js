var ultrilliam = {
	addYoutube: function(message) {
		var r1 = /youtube.com\/watch.*[?&]v=(.{11})/i;
		var r2 = /youtu.be\/(.{11})/i;
		var isYoutube = r1.test(message) || r2.test(message);
		if (isYoutube) {
      var videoId = RegExp.$1;
      var message = message + '<br/>';
      return (message + '<iframe width="160" height="200" src="https://www.youtube.com/embed/' + videoId + '" frameborder="0" allowfullscreen></iframe>');
		}
		return message;
	},
  checkScroll: function(element) {
    var delta = Math.floor(element[0].scrollHeight) - Math.floor(element.scrollTop());
    return (delta - 150 < element.height()) && (delta + 150 > element.height())
  }
};
