const crypto = require('crypto');

const cryptoHash = (...inputs) => {
    const hash = crypto.createHash('sha256');

    // Sort the inputs to ensure consistent hashing
    hash.update(inputs.map(input => JSON.stringify(input)).sort().join(' '));

    return hash.digest('hex');
};

module.exports = cryptoHash;