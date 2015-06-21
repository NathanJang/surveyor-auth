var Token = function (id, salt, hash) {
    // Make the `new` keyword optional.
    // It's a JavaScript quirk that can be ignored.
    if (!(this instanceof Token)) {
        return new Token(id, salt, hash);
    }

    // Assign the object's properties.
    this.id = id;
    this.salt = salt;
    this.hash = hash;
};

// Define the methods to convert a Token object to a string.
Token.prototype.toString = Token.prototype.valueOf = function () {
    return [this.salt, this.hash].join('');
};

/** @method tokenWithString
 * Generates a Token object given a string and configuration values.
 * @static
 * @param {String} string
 * @param {Number} saltLength
 * @param {Number} hashLength
 * @returns {Token}
 */
Token.tokenWithString = function (id, string, saltLength, hashLength) {
    if (string.length !== saltLength + hashLength) {
        throw new Error('Invalid arguments.');
    }

    var salt = string.substring(0, saltLength);
    var hash = string.substring(saltLength);

    return new Token(id, salt, hash);
};

Token.compare = function (a, b) {
    if (!(a instanceof Token) || !(b instanceof Token)) {
        throw new Error('Unable to compare non-objects of Token.');
    }

    a.id = Math.floor(a.id);
    b.id = Math.floor(b.id);
    return a.id === b.id && a.salt === b.salt && a.hash === b.hash;
};

module.exports = Token;
