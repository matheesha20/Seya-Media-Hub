# Seya Media Hub

Seya Media Hub is a lightweight multi-tenant media hosting and transformation service that uses Hetzner Object Storage for originals and variants and Cloudflare for global CDN delivery. This repository contains a minimal MVP with an API server, background worker and Next.js dashboard.

## Getting Started

1. Copy `.env.example` to `.env` and fill in your credentials.
2. Install dependencies using npm (workspaces are used).
3. Start services with Docker Compose:

```bash
docker compose up --build
```

The API will be available on port `8080` and the dashboard on `3000` by default.

## Cloudflare Setup

Create a proxied DNS record pointing `cdn.yourdomain.com` to your Hetzner bucket endpoint. Configure a Cache Rule to cache everything under `/tenants/*` and respect origin cache-control headers. Set edge TTL of seven days for originals and one year for generated variants. Bypass cache for all `/v1/*` API routes.

## Hetzner Object Storage

Create a bucket and note the access keys. The bucket should only be accessible via Cloudflare. Optionally allow-list Cloudflare IP ranges.

## Purging CDN

The API exposes `POST /v1/admin/cdn/purge` for invalidating Cloudflare cache entries. You can pass a path or array of paths to purge.

## TODO

* Billing and payments
* AI transforms
* ClamAV integration
* HEVC licensing
