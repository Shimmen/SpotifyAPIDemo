(function() {
	'use strict';

	function getCookie(name) {
		var match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
		if (match) return match[1];
		else return null;
	}

	function removeElementWithId(id) {
		var toRemove = document.getElementById(id);
		toRemove.parentNode.removeChild(toRemove);
	}

	// HACK: Just for simplicity, so I don't have to do any fancy rendering of stuff
	var cookieVal = getCookie('spotify_access_token')
	if (cookieVal !== null) {
		removeElementWithId('pre-login');
	} else {
		removeElementWithId('post-login');
	}

})();