#!/usr/bin/env node

/**
 * Debug regex for placeholder detection
 */

const testHtml = `<!-- IMAGE_PLACEHOLDER:A beautiful sunset over mountains:Sunset landscape-->`;

console.log('Testing regex on:', testHtml);
console.log('');

// Current regex
const commentPlaceholderRegex = /<!-- IMAGE_PLACEHOLDER:([^:]+):([^>]+) -->/g;
const match = commentPlaceholderRegex.exec(testHtml);

if (match) {
    console.log('Match found!');
    console.log('Full match:', match[0]);
    console.log('Prompt:', match[1]);
    console.log('Description:', match[2]);
} else {
    console.log('No match with current regex');
    
    // Try alternative regex
    console.log('\nTrying alternative regex...');
    
    // More flexible regex
    const altRegex = /<!-- IMAGE_PLACEHOLDER:([^:]+):([^-]+)-->/g;
    const altMatch = altRegex.exec(testHtml);
    
    if (altMatch) {
        console.log('Alternative match found!');
        console.log('Full match:', altMatch[0]);
        console.log('Prompt:', altMatch[1]);
        console.log('Description:', altMatch[2]);
    } else {
        console.log('No match with alternative regex either');
        
        // Even more flexible
        const flexRegex = /<!-- IMAGE_PLACEHOLDER:(.+?):(.+?)-->/g;
        const flexMatch = flexRegex.exec(testHtml);
        
        if (flexMatch) {
            console.log('Flexible match found!');
            console.log('Full match:', flexMatch[0]);
            console.log('Prompt:', flexMatch[1]);
            console.log('Description:', flexMatch[2]);
        }
    }
}

// Test with Russian text
console.log('\n\nTesting with Russian text...');
const russianHtml = `<!-- IMAGE_PLACEHOLDER:Красивый закат над горами:Закат над горами цифровое искусство-->`;
console.log('Testing:', russianHtml);

const flexRegex = /<!-- IMAGE_PLACEHOLDER:(.+?):(.+?)-->/g;
const ruMatch = flexRegex.exec(russianHtml);

if (ruMatch) {
    console.log('Russian match found!');
    console.log('Full match:', ruMatch[0]);
    console.log('Prompt:', ruMatch[1]);
    console.log('Description:', ruMatch[2]);
}