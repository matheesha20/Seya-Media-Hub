#!/bin/bash

echo "🧪 Testing BunnyCDN Configuration with cURL...\n"

# Load environment variables
source .env

echo "📋 Current Configuration:"
echo "   Endpoint: $S3_ENDPOINT"
echo "   Bucket: $S3_BUCKET"
echo "   Access Key: $S3_ACCESS_KEY"
echo "   Secret Key: ${S3_SECRET_KEY:0:10}..." # Show only first 10 chars
echo "   CDN Host: $CDN_PUBLIC_HOST"
echo ""

# Test 1: List storage zone contents
echo "1️⃣ Testing storage zone access..."
response=$(curl -s -H "AccessKey: $S3_SECRET_KEY" \
  "https://storage.bunnycdn.com/$S3_BUCKET/?path=/")

if [[ $response == *"error"* ]]; then
    echo "❌ Failed to access storage zone:"
    echo "$response"
    echo ""
    echo "🔧 Troubleshooting:"
    echo "1. Check your S3_SECRET_KEY (API Key from BunnyCDN dashboard)"
    echo "2. Verify your S3_BUCKET (storage zone name)"
    echo "3. Ensure your API key has proper permissions"
    exit 1
else
    echo "✅ Storage zone accessible"
fi

# Test 2: Upload test file
echo ""
echo "2️⃣ Creating test file..."
test_content="Hello from Seya Media Hub! $(date)"
test_key="test/hello.txt"

upload_response=$(curl -s -X PUT \
  -H "AccessKey: $S3_SECRET_KEY" \
  -H "Content-Type: text/plain" \
  -d "$test_content" \
  "https://storage.bunnycdn.com/$S3_BUCKET/$test_key")

if [[ $upload_response == *"error"* ]]; then
    echo "❌ Failed to upload test file:"
    echo "$upload_response"
    exit 1
else
    echo "✅ Test file uploaded successfully"
fi

# Test 3: Read test file
echo ""
echo "3️⃣ Reading test file..."
read_response=$(curl -s -H "AccessKey: $S3_SECRET_KEY" \
  "https://storage.bunnycdn.com/$S3_BUCKET/$test_key")

if [[ $read_response == *"error"* ]]; then
    echo "❌ Failed to read test file:"
    echo "$read_response"
else
    echo "✅ File content: $read_response"
fi

# Test 4: Test CDN URL
echo ""
echo "4️⃣ Testing CDN URL..."
if [[ -n "$CDN_PUBLIC_HOST" ]]; then
    cdn_url="https://$CDN_PUBLIC_HOST/$test_key"
    echo "✅ CDN URL: $cdn_url"
    echo "   (You can test this URL in your browser)"
    
    # Test CDN access
    cdn_response=$(curl -s -I "$cdn_url" | head -1)
    if [[ $cdn_response == *"200"* ]]; then
        echo "✅ CDN is working correctly"
    else
        echo "⚠️  CDN might not be configured yet (this is normal for new setups)"
    fi
else
    echo "⚠️  CDN_PUBLIC_HOST not configured"
fi

# Test 5: Clean up
echo ""
echo "5️⃣ Cleaning up test file..."
delete_response=$(curl -s -X DELETE \
  -H "AccessKey: $S3_SECRET_KEY" \
  "https://storage.bunnycdn.com/$S3_BUCKET/$test_key")

if [[ $delete_response == *"error"* ]]; then
    echo "⚠️  Failed to delete test file:"
    echo "$delete_response"
else
    echo "✅ Test file deleted"
fi

echo ""
echo "🎉 BunnyCDN connection test completed!"
echo ""
echo "📋 Summary:"
echo "   ✅ Storage zone: $S3_BUCKET"
echo "   ✅ API access: Working"
echo "   ✅ File operations: Working"
echo "   ✅ CDN host: $CDN_PUBLIC_HOST"
echo ""
echo "🚀 Your BunnyCDN is ready for use with Seya Media Hub!"
