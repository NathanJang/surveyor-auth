#!/usr/bin/env node

// Import dependencies.
var commander = require('commander');
var SurveyorAuth = require('./');
var package = require('./package.json');

// Set up the CLI.
commander
    .version(package.version)
    .usage('[--generate|--generate-range|--verify] --key <key> --id <id>')
    .option('-k, --key <key>', 'Specify a private key.')
    .option('-g, --generate', 'Generate a single token.')
    .option('-G, --generate-range', 'Generate a token in the given range, inclusive.')
    .option('-v, --verify', 'Verify a token given an ID.')
    .option('--id <id>', 'An ID.')
    .option('--to <id>')
    .option('-t, --token <token>', 'A token.')
    .option('--salt-length <n>', 'Specify a salt length. Defaults to 2.')
    .option('--hash-length <n>', 'Specify a hash length. Defaults to 8.')
    .parse(process.argv);

// Error if no command specified.
if (!commander.generate && !commander.generateRange && !commander.verify) {
    throw new Error('No command specified.');
}

// Error if there isn't an ID.
if (!commander.id) {
    throw new Error('No ID specified.');
}

// Create SurveyorAuth instance.
var surveyorAuth = new SurveyorAuth(commander.key, commander.saltLength, commander.hashLength);

// Define a function to print out results.
var writeJson = function (object) {
    process.stdout.write(JSON.stringify(object, null, 4) + '\n');
};

if (commander.verify) {
    var isVerified = surveyorAuth.verifyTokenWithId(commander.id, commander.token);
    writeJson(isVerified);
    process.exit(!isVerified);
} else if (commander.generate) {
    var tokenString = surveyorAuth.generateTokenWithId(commander.id).toString();
    var object = {
        id: commander.id,
        token: tokenString
    };
    writeJson(object);
} else if (commander.generateRange) {
    if (!commander.to) {
        throw new Error('No --to specified.');
    }

    var tokens = surveyorAuth.generateTokensWithIdRange(commander.id, commander.to);
    var objectArray = [];
    for (var i = 0; i < tokens.length; i++) {
        var object = {
            id: tokens[i].id,
            token: tokens[i].toString()
        };
        objectArray.push(object);
    }
    writeJson(objectArray);
}

