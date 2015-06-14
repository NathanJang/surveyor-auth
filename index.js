// Import a library for computing SHA256 hashes.
var Hashes = require('jshashes');
var SHA256 = new Hashes.SHA256();

// Import a library for generating cryptographically secure random bits.
var Random = require('random-js');

// Import the Token class from ./token.js.
var Token = require('./token');

// Declare a constructor for the SurveyorAuth class.
/**
 * An object that has methods to generate and verify tokens that conform to this project's token specification.
 * @constructor
 * @param {String} privateKey - A private key that will be used to generate and verify tokens.
 * @param {Number} saltLength - An optional parameter representing the length of the salt. Defaults to 2.
 * @param {Number} shortenedHashLength - An optional parameter representing the length of the SHA256 hash's substring length. Defaults to 8.
 */
var SurveyorAuth = function (privateKey, saltLength, shortenedHashLength) {
    // Make the `new` keyword optional.
    // It's a JavaScript quirk that can be ignored.
    if (!(this instanceof SurveyorAuth)) {
        return new SurveyorAuth(saltLength, shortenedHashLength);
    }

    // Error if there is no private key specified.
    if (!privateKey) {
        throw new Error('A private key is required.');
    }

    // Assign the object's properties.
    this.PRIVATE_KEY = privateKey;

    // Assign properties with defaults if the values were not specified in object creation.
    this.SALT_LENGTH = saltLength || 2;
    this.SHORTENED_HASH_LENGTH = shortenedHashLength || 8;
};

/** @method generateSalt
 * A wrapper to generate a salt.
 * @returns {String}
 */
SurveyorAuth.prototype.generateSalt = function () {
    // Use the library's cryptographically secure engine.
    var random = new Random(Random.engines.browserCrypto);
    return random.hex(this.SALT_LENGTH);
};

/** @function generateTokenWithIdAndSalt
 * Generates a Token object given an id and a salt.
 * This should generally not be used in production; use {@link SurveyorAuth#generateTokenWithId} instead.
 * @private
 * @param {Number} id
 * @param {String} salt
 * @returns {Token}
 */
var generateTokenWithIdAndSalt = function (id, salt) {
    // Check if the salt is the correct length.
    if (salt.length !== this.SALT_LENGTH) {
        throw new Error('The salt does not have the correct length.');
    }

    // Convert the ID to an integer.
    id = Math.floor(id);
    // Check if the ID is negative.
    if (id < 0) {
        throw new Error('The ID must be greater than 0.');
    }

    // Generate a string to hash by joining the ID, private key, and salt with underscores.
    var stringToHash = [id, this.PRIVATE_KEY, salt].join('_');
    // Hash it.
    var rawHash = SHA256.hex(stringToHash);
    // Take the SHA256 hash's first nth characters, where n is the SurveyorAuth object's hash length setting.
    var shortenedHash = rawHash.substring(0, this.SHORTENED_HASH_LENGTH);
    return new Token(id, salt, shortenedHash);
};

/** @method generateTokenWithId
 * Generates a Token object with a random salt, given an id.
 * @param {Number} id
 * @returns {Token}
 */
SurveyorAuth.prototype.generateTokenWithId = function (id) {
    // Pass a random salt to generateTokenWithIdAndSalt.
    var salt = this.generateSalt();
    return generateTokenWithIdAndSalt.call(this, id, salt);
};

/** @method generateTokensWithIdRange
 * Generates an array of Token objects within the given range (inclusive).
 * @param {Number} fromId
 * @param {Number} toId
 * @returns {Token[]}
 */
SurveyorAuth.prototype.generateTokensWithIdRange = function (fromId, toId) {
    // Convert the IDs to integers.
    fromId = Math.floor(fromId);
    toId = Math.floor(toId);

    // Check if from > to.
    if (fromId > toId) {
        throw new Error('Invalid range.');
    }

    // Initialise an empty array.
    var tokenArray = [];
    // Iterate through the range and add Token objects to the array.
    var currentId = fromId;
    while (currentId <= toId) {
        tokenArray.push(this.generateTokenWithId(currentId));
        currentId++;
    }
    return tokenArray;
};

/** @method verifyTokenWithId
 * Verifies a token given an ID.
 * @param {Number} id
 * @param {Token|String} token
 * @returns {Boolean}
 */
SurveyorAuth.prototype.verifyTokenWithId = function (id, token) {
    // Check if the token is a Token object; initialise one if it's not.
    if (!(token instanceof Token)) {
        token = Token.tokenWithString(id, token, this.SALT_LENGTH, this.SHORTENED_HASH_LENGTH);
    }

    // Regenerate a token based on the ID and the salt.
    var regeneratedToken = generateTokenWithIdAndSalt.call(this, id, token.salt);
    // Compare the two tokens; if they're the same, then all is well.
    return regeneratedToken.toString() === token.toString();
};

module.exports = SurveyorAuth;
