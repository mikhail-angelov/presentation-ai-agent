// Test script to verify background image generation
const testHtmlWithBackgrounds = `
<!DOCTYPE html>
<html>
<body>
  <section class="slide first-slide" style="<!-- BACKGROUND_IMAGE_PLACEHOLDER:A futuristic cityscape with flying cars and neon lights:Future city background -->">
    <h1 class="slide-title">The Future of Transportation</h1>
    <p class="slide-subtitle">Innovations in urban mobility</p>
    <div class="slide-number">Slide 1 of 3</div>
  </section>
  
  <section class="slide" data-background-image="Abstract network diagram showing interconnected nodes">
    <h1 class="slide-title">Network Architecture</h1>
    <p>Understanding complex systems</p>
    <div class="slide-number">Slide 2 of 3</div>
  </section>
  
  <section class="slide">
    <h1 class="slide-title">Regular Slide</h1>
    <p>This slide has a regular image:</p>
    <!-- IMAGE_PLACEHOLDER:A team of engineers working on a prototype:Engineering team -->
    <div class="slide-number">Slide 3 of 3</div>
  </section>
</body>
</html>
`;

async function testBackgroundImageGeneration() {
  console.log('Testing background image generation...\n');
  
  // Start dev server if not running
  console.log('Starting development server...');
  const { exec } = require('child_process');
  const devProcess = exec('npm run dev');
  
  // Wait for server to start
  await new Promise(resolve => setTimeout(resolve, 5000));
  
  // Test 1: Generate background image from style attribute
  console.log('Test 1: Generating background image from style attribute placeholder');
  try {
    const response1 = await fetch('http://localhost:3000/api/generate-images', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        htmlContent: testHtmlWithBackgrounds,
        placeholderIndex: 0, // First placeholder is the background in style attribute
      }),
    });
    
    const result1 = await response1.json();
    console.log('Response:', {
      success: result1.success,
      imagesGenerated: result1.imagesGenerated,
      placeholderGenerated: result1.placeholderGenerated,
    });
    
    if (result1.success && result1.imagesGenerated === 1) {
      console.log('✅ Test 1 passed: Background image generated from style attribute\n');
      
      // Check if the replacement worked correctly
      if (result1.htmlContent.includes('background-image: url')) {
        console.log('   ✓ Background image CSS added correctly');
      }
    } else {
      console.log('❌ Test 1 failed:', result1.error || 'Unknown error\n');
    }
  } catch (error) {
    console.log('❌ Test 1 error:', error.message, '\n');
  }
  
  // Test 2: Generate background image from data attribute
  console.log('Test 2: Generating background image from data-background-image attribute');
  try {
    const response2 = await fetch('http://localhost:3000/api/generate-images', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        htmlContent: testHtmlWithBackgrounds,
        placeholderIndex: 1, // Second placeholder is data-background-image
      }),
    });
    
    const result2 = await response2.json();
    console.log('Response:', {
      success: result2.success,
      imagesGenerated: result2.imagesGenerated,
      placeholderGenerated: result2.placeholderGenerated,
    });
    
    if (result2.success && result2.imagesGenerated === 1) {
      console.log('✅ Test 2 passed: Background image generated from data attribute\n');
      
      // Check if data attribute was removed and style added
      if (!result2.htmlContent.includes('data-background-image') && 
          result2.htmlContent.includes('background-image: url')) {
        console.log('   ✓ Data attribute replaced with style attribute');
      }
    } else {
      console.log('❌ Test 2 failed:', result2.error || 'Unknown error\n');
    }
  } catch (error) {
    console.log('❌ Test 2 error:', error.message, '\n');
  }
  
  // Test 3: Generate regular image (non-background)
  console.log('Test 3: Generating regular image (non-background)');
  try {
    const response3 = await fetch('http://localhost:3000/api/generate-images', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        htmlContent: testHtmlWithBackgrounds,
        placeholderIndex: 2, // Third placeholder is regular image
      }),
    });
    
    const result3 = await response3.json();
    console.log('Response:', {
      success: result3.success,
      imagesGenerated: result3.imagesGenerated,
      placeholderGenerated: result3.placeholderGenerated,
    });
    
    if (result3.success && result3.imagesGenerated === 1) {
      console.log('✅ Test 3 passed: Regular image generated\n');
      
      // Check if regular img tag was created
      if (result3.htmlContent.includes('<img src="data:image/jpeg;base64')) {
        console.log('   ✓ Regular img tag created correctly');
      }
    } else {
      console.log('❌ Test 3 failed:', result3.error || 'Unknown error\n');
    }
  } catch (error) {
    console.log('❌ Test 3 error:', error.message, '\n');
  }
  
  // Test 4: Legacy mode (generate all images)
  console.log('Test 4: Testing legacy mode with mixed image types');
  try {
    const response4 = await fetch('http://localhost:3000/api/generate-images', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        htmlContent: testHtmlWithBackgrounds,
      }),
    });
    
    const result4 = await response4.json();
    console.log('Response:', {
      success: result4.success,
      imagesGenerated: result4.imagesGenerated,
      totalPlaceholders: result4.totalPlaceholders,
    });
    
    if (result4.success && result4.imagesGenerated === 3) {
      console.log('✅ Test 4 passed: All 3 images generated in legacy mode\n');
      
      // Check that we have both background and regular images
      const hasBackgroundImages = result4.htmlContent.includes('background-image: url');
      const hasRegularImages = result4.htmlContent.includes('<img src="data:image/jpeg;base64');
      
      if (hasBackgroundImages && hasRegularImages) {
        console.log('   ✓ Mixed image types processed correctly');
      }
    } else {
      console.log('❌ Test 4 failed:', result4.error || 'Unknown error\n');
    }
  } catch (error) {
    console.log('❌ Test 4 error:', error.message, '\n');
  }
  
  console.log('\nTests completed!');
  
  // Kill dev server
  devProcess.kill();
}

// Run the test
testBackgroundImageGeneration().catch(console.error);