# Seya Media Hub

**Fast, low-cost image & video optimization + CDN** for SMEs and agencies in South Asia.

## Features

- 🖼️ **Image Optimization**: Resize, format conversion, quality adjustment, and effects
- 🎥 **Video Processing**: HLS streaming, MP4 fallback, automatic thumbnails
- 🌐 **Global CDN**: Fast delivery with edge caching
- 🔐 **Secure URLs**: HMAC-signed transform URLs with expiration
- 📊 **Usage Tracking**: Real-time metering and limits enforcement
- 🔑 **API Keys**: Secure access with per-project keys
- 📱 **Modern Dashboard**: Beautiful UI for asset management

## Tech Stack

- **API**: Fastify + TypeScript
- **Database**: PostgreSQL + Prisma
- **Queue**: Redis + BullMQ
- **Storage**: S3-compatible (Backblaze B2, Wasabi, etc.)
- **CDN**: BunnyCDN or Cloudflare
- **Image Processing**: Sharp
- **Video Processing**: FFmpeg
- **Dashboard**: Next.js + Tailwind CSS

## Quick Start

### Prerequisites

- Node.js 18+
- Docker & Docker Compose
- FFmpeg (for video processing)

### 1. Clone and Setup

```bash
git clone <repository-url>
cd seya-media-hub
npm install
```

### 2. Environment Configuration

Copy the example environment file and configure your settings:

```bash
cp .env.example .env
```

Edit `.env` with your configuration:

```env
# Database
DATABASE_URL=postgres://mediahub:mediahub@localhost:5432/mediahub

# Storage (S3 compatible)
S3_ENDPOINT=https://s3.backblazeb2.com
S3_BUCKET=seya-media
S3_ACCESS_KEY=your_access_key
S3_SECRET_KEY=your_secret_key

# CDN
CDN_PUBLIC_HOST=cdn.seya.media

# JWT Secret (change in production)
JWT_SECRET=your-super-secret-jwt-key
```

### 3. Start Services

```bash
# Start database and Redis
npm run start

# Run database migrations
npm run db:migrate

# Start development servers
npm run dev
```

This will start:
- API server on `http://localhost:8080`
- Dashboard on `http://localhost:3000`
- PostgreSQL on `localhost:5432`
- Redis on `localhost:6379`

### 4. Create Account

Visit `http://localhost:3000` and create your first account.

## API Documentation

### Authentication

The API supports two authentication methods:

1. **JWT Tokens** (for dashboard access)
2. **API Keys** (for programmatic access)

#### JWT Authentication

```bash
# Login
curl -X POST http://localhost:8080/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password"}'

# Use token
curl -H "Authorization: Bearer <jwt_token>" \
  http://localhost:8080/v1/assets
```

#### API Key Authentication

```bash
# Use API key
curl -H "x-api-key: <api_key>" \
  http://localhost:8080/v1/assets
```

### Upload Flow

#### 1. Initiate Upload

```bash
curl -X POST http://localhost:8080/v1/uploads/initiate \
  -H "x-api-key: <api_key>" \
  -H "Content-Type: application/json" \
  -d '{
    "filename": "hero.jpg",
    "mime": "image/jpeg",
    "bytes": 523423,
    "kind": "image"
  }'
```

Response:
```json
{
  "uploadUrl": "https://s3.backblazeb2.com/...",
  "storageKey": "image/account_id/timestamp_random.jpg",
  "assetTempId": "temp_1234567890_abc123",
  "expiresIn": 3600
}
```

#### 2. Upload File

```bash
curl -X PUT "<uploadUrl>" \
  -H "Content-Type: image/jpeg" \
  --upload-file hero.jpg
```

#### 3. Commit Upload

```bash
curl -X POST http://localhost:8080/v1/assets/commit \
  -H "x-api-key: <api_key>" \
  -H "Content-Type: application/json" \
  -d '{
    "assetTempId": "temp_1234567890_abc123",
    "storageKey": "image/account_id/timestamp_random.jpg"
  }'
```

### Image Transformations

#### Signed URL Format

```
https://cdn.seya.media/i/{account_id}/{asset_id}?w=800&h=600&fm=webp&q=72&exp=1735689600&sig=hmac_signature
```

#### Supported Parameters

| Parameter | Type | Description | Example |
|-----------|------|-------------|---------|
| `w` | number | Width in pixels | `800` |
| `h` | number | Height in pixels | `600` |
| `fit` | string | Resize mode: `cover`, `contain`, `inside`, `outside` | `cover` |
| `fm` | string | Format: `webp`, `avif`, `jpg`, `png` | `webp` |
| `q` | number | Quality (1-95) | `72` |
| `dpr` | number | Device pixel ratio (1-3) | `2` |
| `bg` | string | Background color (hex) | `ffffff` |
| `blur` | number | Blur radius | `5` |
| `sharpen` | number | Sharpen amount | `1` |
| `orient` | boolean | Auto-orient | `true` |
| `strip` | boolean | Strip metadata | `true` |

#### Generate Transform URL

```bash
curl -X GET "http://localhost:8080/v1/assets/{asset_id}/transform-url?w=800&fm=webp&q=72" \
  -H "x-api-key: <api_key>"
```

Response:
```json
{
  "url": "https://cdn.seya.media/i/account_id/asset_id?w=800&fm=webp&q=72&exp=1735689600&sig=abc123...",
  "params": {
    "w": 800,
    "fm": "webp",
    "q": 72
  }
}
```

### Asset Management

#### List Assets

```bash
curl -H "x-api-key: <api_key>" \
  "http://localhost:8080/v1/assets?kind=image&page=1&limit=20"
```

#### Get Asset Details

```bash
curl -H "x-api-key: <api_key>" \
  "http://localhost:8080/v1/assets/{asset_id}"
```

#### Delete Asset

```bash
curl -X DELETE -H "x-api-key: <api_key>" \
  "http://localhost:8080/v1/assets/{asset_id}"
```

### API Key Management

#### Create API Key

```bash
curl -X POST http://localhost:8080/v1/apikeys \
  -H "Authorization: Bearer <jwt_token>" \
  -H "Content-Type: application/json" \
  -d '{"name": "Production API Key"}'
```

#### List API Keys

```bash
curl -H "Authorization: Bearer <jwt_token>" \
  "http://localhost:8080/v1/apikeys"
```

#### Revoke API Key

```bash
curl -X DELETE -H "Authorization: Bearer <jwt_token>" \
  "http://localhost:8080/v1/apikeys/{key_id}"
```

### Usage & Limits

#### Get Usage

```bash
curl -H "Authorization: Bearer <jwt_token>" \
  "http://localhost:8080/v1/me/usage?range=month"
```

#### Get Limits

```bash
curl -H "Authorization: Bearer <jwt_token>" \
  "http://localhost:8080/v1/me/limits"
```

## URL Signing

### Node.js Helper

```javascript
import crypto from 'crypto';

function signTransformURL(secret, basePath, params) {
  const { exp = Math.floor(Date.now()/1000) + 3600, ...rest } = params;
  const qp = new URLSearchParams(Object.entries(rest).sort(([a],[b]) => a.localeCompare(b)));
  qp.append('exp', String(exp));
  const base = `${basePath}?${qp.toString()}`;
  const sig = crypto.createHmac('sha256', secret).update(base).digest('hex');
  return `${base}&sig=${sig}`;
}

// Usage
const url = signTransformURL(
  'your-signing-secret',
  '/i/account_id/asset_id',
  { w: 800, h: 600, fm: 'webp', q: 72 }
);
```

### Python Helper

```python
import hmac
import hashlib
import time
from urllib.parse import urlencode

def sign_transform_url(secret, base_path, params):
    exp = params.get('exp', int(time.time()) + 3600)
    rest = {k: v for k, v in params.items() if k != 'exp'}
    
    # Sort parameters
    sorted_params = sorted(rest.items())
    qp = urlencode(sorted_params) + f'&exp={exp}'
    
    base = f"{base_path}?{qp}"
    sig = hmac.new(secret.encode(), base.encode(), hashlib.sha256).hexdigest()
    
    return f"{base}&sig={sig}"
```

## Plans & Pricing

| Plan | Storage | Egress | Transforms | Price |
|------|---------|--------|------------|-------|
| Starter | 5GB | 50GB | 200K | Free |
| Growth | 20GB | 200GB | 300K | $29/month |
| Pro | 100GB | 1TB | 1.5M | $99/month |

## Development

### Project Structure

```
seya-media-hub/
├── apps/
│   ├── api/                 # Fastify API server
│   │   ├── src/
│   │   │   ├── routes/      # API routes
│   │   │   ├── services/    # Business logic
│   │   │   └── main.ts      # Server entry point
│   │   └── worker.ts        # Background job worker
│   └── dashboard/           # Next.js dashboard
│       ├── app/             # App router pages
│       └── components/      # React components
├── packages/
│   └── db/                  # Database schema & client
├── docker-compose.yml       # Local development
└── README.md
```

### Running Tests

```bash
# API tests
cd apps/api && npm test

# Dashboard tests
cd apps/dashboard && npm test
```

### Database Migrations

```bash
# Generate migration
npm run db:generate

# Run migrations
npm run db:migrate

# Reset database
npm run db:reset
```

### Production Deployment

1. **Set up infrastructure**:
   - VPS with Docker
   - PostgreSQL database
   - Redis instance
   - S3-compatible storage
   - CDN (BunnyCDN/Cloudflare)

2. **Configure environment**:
   ```bash
   NODE_ENV=production
   DATABASE_URL=postgres://...
   REDIS_URL=redis://...
   S3_ENDPOINT=https://...
   CDN_PUBLIC_HOST=cdn.yourdomain.com
   ```

3. **Deploy**:
   ```bash
   docker-compose -f docker-compose.prod.yml up -d
   ```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## License

MIT License - see LICENSE file for details.

## Support

- 📧 Email: support@seya.media
- 📖 Documentation: https://docs.seya.media
- 🐛 Issues: GitHub Issues
