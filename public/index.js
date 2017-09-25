(function() {

	// From: https://stackoverflow.com/questions/901115/how-can-i-get-query-string-values-in-javascript
	function getParameterByName(name, url) {
		if (!url) url = window.location.href;
		name = name.replace(/[\[\]]/g, "\\$&");
		var regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)");
		var results = regex.exec(url);
		if (!results) return null;
		if (!results[2]) return '';
		return decodeURIComponent(results[2].replace(/\+/g, " "));
	}

	function getQueryOrStorageValueAndSave(key) {
		var value = getParameterByName(key);
		if (value) {
			window.localStorage.setItem(key, value);
			return value;
		} else {
			return window.localStorage.getItem(key);
		}
	}

	function removeQueryParametersFromUrl() {
		var idx = window.location.href.indexOf('?');
		if (idx > 0) {
			window.location.href = window.location.href.substring(0, idx);
		}
	}

	var accessToken = getQueryOrStorageValueAndSave('access_token');
	var refreshToken = getQueryOrStorageValueAndSave('refresh_token');
	//removeQueryParametersFromUrl();

	function removeElementWithId(id) {
		var toRemove = document.getElementById(id);
		toRemove.parentNode.removeChild(toRemove);
	}

	// HACK: Just for simplicity, so I don't have to do any fancy rendering of stuff
	if (accessToken && refreshToken) {
		removeElementWithId('pre-login');
	} else {
		removeElementWithId('post-login');
	}

})();