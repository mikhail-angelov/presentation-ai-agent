#!/usr/bin/env node

/**
 * Simple test script for Yandex ML image generation
 * This script tests the generateImage function and saves the result to a file
 */

import 'dotenv/config';
import { generateImage } from '../app/lib/agent/yandexML';
import fs from 'fs';
import path from 'path';

async function runTest() {
  console.log('🧪 Testing Yandex ML Image Generation...\n');

  // Check if credentials are available
  if (!process.env.YA_ID || !process.env.YA_DIRECTORY_ID) {
    console.error('❌ Yandex ML credentials not found in environment variables');
    console.error('   Please ensure YA_ID and YA_DIRECTORY_ID are set in .env file');
    process.exit(1);
  }

  console.log('✅ Yandex ML credentials found');
  console.log(`   Directory ID: ${process.env.YA_DIRECTORY_ID}`);

  const testPrompts = [
    'A beautiful sunset over mountains, digital art style',
    // 'A futuristic city with flying cars, cyberpunk style',
    // 'A cute cartoon cat sitting on a laptop, vector art'
  ];

  for (const [index, prompt] of testPrompts.entries()) {
    console.log(`\n--- Test ${index + 1}/${testPrompts.length} ---`);
    console.log(`Prompt: "${prompt}"`);

    try {

      // Test 2: Generate image and save to file
      console.log('  2. Testing image generation with file save...');
      const startTime2 = Date.now();
      const imageBase64WithFile = await generateImage(prompt, true);
      const duration2 = Date.now() - startTime2;
      
      console.log(`     ✅ Success! Generated ${imageBase64WithFile.length} characters of base64`);
      console.log(`     ⏱️  Time: ${duration2}ms`);

      // Verify both results are similar (not necessarily identical due to randomness)
      if ( imageBase64WithFile.length > 1000) {
        console.log(`     📊 results are valid base64 strings`);
      }

    } catch (error) {
      console.error(`     ❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      
      // Check if it's an authentication error
      if (error instanceof Error && error.message.includes('Unauthorized')) {
        console.error('\n⚠️  Authentication failed. The JWT token might be expired.');
        console.error('   Please check your Yandex Cloud IAM token.');
        console.error('   You can get a new token with:');
        console.error('   yc iam create-token');
        break;
      }
    }
  }

  console.log('\n📁 Checking generated images directory...');
  const generatedImagesDir = process.cwd() //path.join(process.cwd(), 'generated_images');
  
  if (fs.existsSync(generatedImagesDir)) {
    const files = fs.readdirSync(generatedImagesDir);
    console.log(`   Found ${files.length} generated image(s):`);
    
    files.forEach((file, index) => {
      const filePath = path.join(generatedImagesDir, file);
      const stats = fs.statSync(filePath);
      console.log(`   ${index + 1}. ${file} (${Math.round(stats.size / 1024)} KB)`);
    });
  } else {
    console.log('   No generated images directory found (might be due to errors)');
  }

  console.log('\n🎉 Test completed!');
}

// Run the test
runTest().catch(error => {
  console.error('❌ Unhandled error in test:', error);
  process.exit(1);
});