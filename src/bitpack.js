

var bitpack = {};

// PACK_WIDTH can be in the range of 1-4.
// The choice of this value is determined by the efficiency of the numbers engine.
// Larger PACK_WIDTHs require larger numbers to be represented by the numbers engine.
var PACK_WIDTH = 3,
    CHAR_MIN = 9,
    CHAR_MAX = 126;

var packer = function(substr) {
    var code = function(i) { return substr.charCodeAt(i); };
    var num = 0;
    if(substr.length >= 1) { num += code(0); }
    if(substr.length >= 2) { num += code(1) << 7; }
    if(substr.length >= 3) { num += code(2) << 14; }
    if(substr.length >= 4) { num += code(3) << 21; }
    return num;
};

var unpacker = function(num, chars) {
    chars = chars || PACK_WIDTH;
    var str = '';
    for(var i = 0; i < chars; i++) {
        str += String.fromCharCode(num & 127);
        num = num >> 7;
    }
    
    return str;
};

bitpack.randomKey = function() {
    return Math.floor(Math.random() * (1 << (PACK_WIDTH * 7)));
};

var spinKey = function(key, cipherBlock) {
    return (cipherBlock ^ key) ^ ((cipherBlock >> 3) ^ key);
};

bitpack.pack = function(str, key) {
    str = String(str);
    
    var block, i, c;
    for(i = 0; i < str.length; i++) {
        c = str.charCodeAt(i);
        if(c < CHAR_MIN || c > CHAR_MAX) { throw 'Invalid character in input.'; }
    }
    
    // The first array of the result is the number of characters in the final block
    // If the length is event divisible by the pack width (length % PACK_WIDTH) == 0
    // Then the length of the final block is equal to the PACK_WIDTH
    var result = [ (str.length % PACK_WIDTH) || PACK_WIDTH ];
    
    for(var i = 0; i < str.length; i+=PACK_WIDTH) {
        block = packer(str.substr(i, PACK_WIDTH)) ^ key;
        key = spinKey(key, block);
        result.push(block);
    }
    
    return result;
};

bitpack.unpack = function(arr, key) {
    var lastBlockLength = arr[0];
    var result = '';
    var block;
    
    for(var i = 1; i < arr.length - 1; i++) {
        block = arr[i];
        result += unpacker(block ^ key);
        key = spinKey(key, block);
    }
    
    result += unpacker(arr[arr.length - 1] ^ key, lastBlockLength);
    
    return result;
};

bitpack.packWidth = PACK_WIDTH;

bitpack.test = function() {
    var input = 'This is a test string';
    var key = randomKey();
    var packed = bitpack.pack(input, key);
    console.log(packed);
    var unpacked = bitpack.unpack(packed, key);
    console.log(unpacked);
};

module.exports = bitpack;

