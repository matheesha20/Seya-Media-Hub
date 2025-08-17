# BunnyCDN Setup Guide for Seya Media Hub

This guide will help you set up BunnyCDN for storage and CDN delivery with the Seya Media Hub.

## 🎯 Overview

BunnyCDN provides two main services we'll use:
1. **Storage Zone**: S3-compatible storage for your media files
2. **Pull Zone**: CDN for fast global delivery

## 📋 Step-by-Step Setup

### 1. Create BunnyCDN Account

1. Go to https://dash.bunny.net/
2. Sign up for a free account
3. Add payment method (required for storage)

### 2. Create Storage Zone

1. **Login to BunnyCDN Dashboard**
2. **Navigate to Storage** → Click "Storage" in left sidebar
3. **Create Storage Zone**:
   - Click **"Add Storage Zone"**
   - **Name**: `seya-media` (or your preferred name)
   - **Region**: Choose closest to your users
     - `Falkenstein` (Europe)
     - `New York` (US East)
     - `Los Angeles` (US West)
     - `Singapore` (Asia)
   - Click **"Add Storage Zone"**

### 3. Get Storage Credentials

1. **Click on your storage zone** (`seya-media`)
2. **Go to "FTP & API Access"** tab
3. **Note down these details**:
   ```
   Storage Zone Name: seya-media
   API Key: [your-api-key]
   Endpoint: https://storage.bunnycdn.com
   ```

### 4. Create Pull Zone (CDN)

1. **Go to "Pull Zones"** in left sidebar
2. **Click "Add Pull Zone"**
3. **Configure Pull Zone**:
   - **Name**: `cdn-seya-media`
   - **Origin URL**: `https://storage.bunnycdn.com/seya-media/`
   - **Zone**: Choose your preferred region
   - **Optimization**: Enable "Optimize Images" if available
   - Click **"Add Pull Zone"**

4. **Get CDN URL**:
   - After creation, note the **CDN URL** (e.g., `https://cdn-seya-media.b-cdn.net`)

### 5. Configure Environment

Update your `.env` file with BunnyCDN settings:

```env
# Storage (BunnyCDN Storage Zone)
S3_ENDPOINT=https://storage.bunnycdn.com
S3_REGION=auto
S3_BUCKET=seya-media
S3_ACCESS_KEY=seya-media
S3_SECRET_KEY=your_api_key_here

# CDN (BunnyCDN Pull Zone)
CDN_PUBLIC_HOST=cdn-seya-media.b-cdn.net
```

### 6. Test Configuration

Run the test script to verify your setup:

```bash
npm run test:bunnycdn
```

This will:
- Test storage zone access
- Upload a test file
- Verify CDN URL generation
- Clean up test files

## 🔧 Advanced Configuration

### Storage Zone Settings

1. **Go to your Storage Zone** → "Settings" tab
2. **Configure**:
   - **File Locking**: Enable for production
   - **Replication**: Enable for redundancy
   - **Object Lock**: Enable for compliance (if needed)

### Pull Zone Settings

1. **Go to your Pull Zone** → "Settings" tab
2. **Configure**:
   - **Cache Control**: Set to `public, max-age=31536000` for images
   - **Gzip Compression**: Enable
   - **Edge Rules**: Add custom caching rules if needed

### Security Settings

1. **Storage Zone Security**:
   - **Access Control**: Set to "Private" for secure access
   - **API Key Permissions**: Limit to read/write only

2. **Pull Zone Security**:
   - **Access Control**: Set to "Public" for CDN delivery
   - **Token Authentication**: Enable for private content (optional)

## 📊 Usage Examples

### Upload File via API

```bash
# 1. Initiate upload
curl -X POST http://localhost:8080/v1/uploads/initiate \
  -H "x-api-key: your_api_key" \
  -H "Content-Type: application/json" \
  -d '{
    "filename": "hero.jpg",
    "mime": "image/jpeg",
    "bytes": 523423,
    "kind": "image"
  }'

# 2. Upload to BunnyCDN
curl -X PUT "https://storage.bunnycdn.com/seya-media/image/account_id/timestamp_random.jpg" \
  -H "AccessKey: your_api_key" \
  -H "Content-Type: image/jpeg" \
  --upload-file hero.jpg

# 3. Commit upload
curl -X POST http://localhost:8080/v1/assets/commit \
  -H "x-api-key: your_api_key" \
  -H "Content-Type: application/json" \
  -d '{
    "assetTempId": "temp_1234567890_abc123",
    "storageKey": "image/account_id/timestamp_random.jpg"
  }'
```

### Transform Image via CDN

```bash
# Generate transform URL
curl -X GET "http://localhost:8080/v1/assets/asset_id/transform-url?w=800&fm=webp&q=72" \
  -H "x-api-key: your_api_key"

# Result: https://cdn-seya-media.b-cdn.net/i/account_id/asset_id?w=800&fm=webp&q=72&exp=1735689600&sig=hmac_signature
```

## 💰 Pricing

### Storage Zone Pricing
- **First 1GB**: Free
- **Additional storage**: $0.01/GB/month

### Pull Zone Pricing
- **First 1TB**: Free
- **Additional bandwidth**: $0.01/GB

### Example Monthly Cost
- **10GB storage**: ~$0.09/month
- **100GB bandwidth**: ~$1.00/month
- **Total**: ~$1.09/month

## 🔍 Monitoring

### BunnyCDN Dashboard
1. **Storage Analytics**: Monitor storage usage
2. **Bandwidth Analytics**: Monitor CDN usage
3. **Cache Hit Rate**: Monitor CDN performance

### API Monitoring
```bash
# Check storage usage
curl -H "AccessKey: your_api_key" \
  "https://storage.bunnycdn.com/seya-media/?path=/"

# Check CDN statistics
curl -H "AccessKey: your_api_key" \
  "https://api.bunny.net/pullzone/your_pull_zone_id/statistics"
```

## 🚨 Troubleshooting

### Common Issues

**1. "Access Denied" Error**
- Check API key permissions
- Verify storage zone name
- Ensure API key is for the correct storage zone

**2. "Bucket Not Found" Error**
- Verify storage zone name in S3_BUCKET
- Check if storage zone exists in correct region

**3. CDN URL Not Working**
- Verify pull zone configuration
- Check origin URL points to correct storage zone
- Ensure pull zone is active

**4. Slow Uploads**
- Check network connection
- Verify storage zone region
- Consider using BunnyCDN's FTP for large files

### Support Resources
- **BunnyCDN Documentation**: https://docs.bunny.net/
- **API Reference**: https://docs.bunny.net/reference
- **Support**: https://support.bunny.net/

## 🎯 Best Practices

1. **Use appropriate regions** for your target audience
2. **Enable compression** for better performance
3. **Set proper cache headers** for different content types
4. **Monitor usage** to optimize costs
5. **Use token authentication** for private content
6. **Enable replication** for high availability

## ✅ Verification Checklist

- [ ] Storage zone created and accessible
- [ ] API key generated and configured
- [ ] Pull zone created and active
- [ ] CDN URL working
- [ ] Environment variables configured
- [ ] Test script passes
- [ ] Upload flow working
- [ ] Transform URLs generating correctly
- [ ] CDN delivery working
- [ ] Monitoring set up

Once you've completed all these steps, your BunnyCDN integration will be ready for production use with the Seya Media Hub!
