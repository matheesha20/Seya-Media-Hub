const AWS = require('aws-sdk');
const fs = require('fs');
const path = require('path');

// Load environment variables from .env file
function loadEnv() {
  const envPath = path.join(__dirname, '..', '.env');
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    const lines = envContent.split('\n');
    lines.forEach(line => {
      const [key, value] = line.split('=');
      if (key && value && !key.startsWith('#')) {
        process.env[key.trim()] = value.trim();
      }
    });
  }
}

loadEnv();

// Configure AWS SDK for BunnyCDN
const s3 = new AWS.S3({
  endpoint: process.env.S3_ENDPOINT || 'https://storage.bunnycdn.com',
  region: process.env.S3_REGION || 'auto',
  accessKeyId: process.env.S3_ACCESS_KEY,
  secretAccessKey: process.env.S3_SECRET_KEY,
  s3ForcePathStyle: true,
});

const bucket = process.env.S3_BUCKET || 'seya-media';

async function testBunnyCDN() {
  console.log('🧪 Testing BunnyCDN Configuration...\n');

  // Display current configuration
  console.log('📋 Current Configuration:');
  console.log(`   Endpoint: ${process.env.S3_ENDPOINT || 'https://storage.bunnycdn.com'}`);
  console.log(`   Bucket: ${process.env.S3_BUCKET || 'seya-media'}`);
  console.log(`   Access Key: ${process.env.S3_ACCESS_KEY || 'Not set'}`);
  console.log(`   Secret Key: ${process.env.S3_SECRET_KEY ? 'Set' : 'Not set'}`);
  console.log(`   CDN Host: ${process.env.CDN_PUBLIC_HOST || 'Not set'}`);
  console.log('');

  if (!process.env.S3_ACCESS_KEY || !process.env.S3_SECRET_KEY) {
    console.error('❌ Missing credentials. Please check your .env file.');
    return;
  }

  try {
    // Test 1: List buckets
    console.log('1️⃣ Testing bucket access...');
    const buckets = await s3.listBuckets().promise();
    console.log('✅ Buckets found:', buckets.Buckets.map(b => b.Name));
    console.log('');

    // Test 2: Create test file
    console.log('2️⃣ Creating test file...');
    const testContent = 'Hello from Seya Media Hub!';
    const testKey = 'test/hello.txt';
    
    await s3.upload({
      Bucket: bucket,
      Key: testKey,
      Body: testContent,
      ContentType: 'text/plain',
    }).promise();
    console.log('✅ Test file uploaded successfully');
    console.log('');

    // Test 3: Read test file
    console.log('3️⃣ Reading test file...');
    const file = await s3.getObject({
      Bucket: bucket,
      Key: testKey,
    }).promise();
    console.log('✅ File content:', file.Body.toString());
    console.log('');

    // Test 4: Generate public URL
    console.log('4️⃣ Testing CDN URL...');
    const cdnHost = process.env.CDN_PUBLIC_HOST;
    if (cdnHost) {
      const cdnUrl = `https://${cdnHost}/${testKey}`;
      console.log('✅ CDN URL:', cdnUrl);
      console.log('   (You can test this URL in your browser)');
    } else {
      console.log('⚠️  CDN_PUBLIC_HOST not configured');
    }
    console.log('');

    // Test 5: Clean up
    console.log('5️⃣ Cleaning up test file...');
    await s3.deleteObject({
      Bucket: bucket,
      Key: testKey,
    }).promise();
    console.log('✅ Test file deleted');
    console.log('');

    console.log('🎉 All tests passed! BunnyCDN is configured correctly.');
    console.log('');
    console.log('📋 Configuration Summary:');
    console.log(`   Storage Endpoint: ${process.env.S3_ENDPOINT}`);
    console.log(`   Storage Zone: ${process.env.S3_BUCKET}`);
    console.log(`   CDN Host: ${process.env.CDN_PUBLIC_HOST || 'Not configured'}`);

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.log('');
    console.log('🔧 Troubleshooting:');
    console.log('1. Check your S3_ACCESS_KEY and S3_SECRET_KEY');
    console.log('2. Verify your storage zone name in S3_BUCKET');
    console.log('3. Ensure your API key has proper permissions');
    console.log('4. Check if your storage zone is in the correct region');
    console.log('');
    console.log('📝 Make sure you\'re using the API Key (not FTP password) from BunnyCDN dashboard');
  }
}

// Run the test
testBunnyCDN();
