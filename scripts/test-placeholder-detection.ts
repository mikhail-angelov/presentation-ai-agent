#!/usr/bin/env node

/**
 * Test script to verify placeholder detection works with actual HTML format
 */

import 'dotenv/config';

// Test HTML with the format we're actually seeing
const testHtml = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Test Presentation</title>
    <style>
        .image-placeholder {
            margin-top: 3rem;
        }
    </style>
</head>
<body>
    <div class="slide">
        <h1>Test Slide</h1>
        <div class="image-placeholder" style="margin-top:3rem;">
         Абстрактная цифровая графика: мозг (чип), подключенный к сети линий и иконкам сервисов (база данных, API, календарь)
        </div>
        <p>Some content here</p>
    </div>
    
    <div class="slide">
        <h2>Another Slide</h2>
        <!-- IMAGE_PLACEHOLDER:A beautiful sunset over mountains:Sunset landscape-->
        <p>More content</p>
    </div>
</body>
</html>
`;

function detectPlaceholders(html: string) {
    console.log('🔍 Detecting placeholders in HTML...\n');
    
    const placeholders = [];
    
    // Format 1: Comment placeholders
    const commentPlaceholderRegex = /<!-- IMAGE_PLACEHOLDER:([^:]+):([^>]+) -->/g;
    let match;
    
    while ((match = commentPlaceholderRegex.exec(html)) !== null) {
        placeholders.push({
            fullMatch: match[0],
            prompt: match[1].trim(),
            description: match[2].trim(),
            type: 'comment'
        });
    }
    
    // Format 2: Div placeholders (what the LLM is actually generating)
    // Match: <div class="image-placeholder"[^>]*>([^<]+)</div>
    const divPlaceholderRegex = /<div\s+class="image-placeholder"[^>]*>([^<]+)<\/div>/gi;
    let divMatch;
    
    while ((divMatch = divPlaceholderRegex.exec(html)) !== null) {
        const fullText = divMatch[1].trim();
        // Try to extract prompt and description
        // The text might be just the prompt, or prompt:description
        let prompt = fullText;
        let description = fullText;
        
        // Check if it has a colon separator
        const colonIndex = fullText.indexOf(':');
        if (colonIndex > -1) {
            prompt = fullText.substring(0, colonIndex).trim();
            description = fullText.substring(colonIndex + 1).trim();
        }
        
        placeholders.push({
            fullMatch: divMatch[0],
            prompt: prompt,
            description: description,
            type: 'div'
        });
    }
    
    return placeholders;
}

// Run the test
const placeholders = detectPlaceholders(testHtml);

console.log(`📊 Found ${placeholders.length} placeholders:\n`);

placeholders.forEach((p, i) => {
    console.log(`Placeholder ${i + 1} (${p.type}):`);
    console.log(`  Full match: "${p.fullMatch.substring(0, 80)}${p.fullMatch.length > 80 ? '...' : ''}"`);
    console.log(`  Prompt: "${p.prompt}"`);
    console.log(`  Description: "${p.description}"`);
    console.log('');
});

// Test replacement
console.log('🔄 Testing replacement...\n');

let processedHtml = testHtml;
placeholders.forEach((p, i) => {
    const imgTag = `<img src="data:image/jpeg;base64,TEST_BASE64_${i}" alt="${p.description}" style="max-width: 100%; height: auto; border-radius: 8px; margin: 10px 0;">`;
    processedHtml = processedHtml.replace(p.fullMatch, imgTag);
    console.log(`Replaced placeholder ${i + 1} with image tag`);
});

console.log('\n✅ Test completed successfully!');
console.log('\n📝 Processed HTML preview:');
console.log(processedHtml.substring(0, 500) + '...');