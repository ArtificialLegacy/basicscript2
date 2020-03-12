const replaceAll = (string, search, replacement) => {
	return string.split(search).join(replacement);
}

const allIndexesOf = (string, subText) => {
	caseSensitive = true;
	var _find = subText;
	if (caseSensitive != true) {
		_this = _this.toLowerCase(); _find = _find.toLowerCase();
	}
	var result = [];
	for (var i = 0; i < string.length;) {
		if (string.substring(i, i + _find.length) == _find) {
			result.push(i); i += _find.length;
		} else i += 1;
	} return result;
}

const replaceAt = (string, index, replacement, x) => {
	return string.substr(0, index) + replacement + string.substr(index + x);
}

const parse = (string, substring, char, igString = false) => {
	if (!igString) {
		let allIndexes = allIndexesOf(string, '`')
		if (allIndexes.length < 1) return replaceAll(string, substring, char);
		for (j = 0; j < allIndexes.length / 2; j += 2) {
			const startOfSubStringIndex = allIndexesOf(string, substring);
			for (o = 0; o < startOfSubStringIndex.length; o++) {
				if (allIndexes[j] < startOfSubStringIndex[o] && allIndexes[j + 1] > startOfSubStringIndex[o]) { } else {
					if (startOfSubStringIndex[o] == -1) return string;
					return replaceAt(string, startOfSubStringIndex[o], char, substring.length);
				}
			}
		}
	} else return string.replace(substring, char);
	return string;
}

module.exports = {

	replaceAll,
	allIndexesOf,
	replaceAt,
	parse,

};
