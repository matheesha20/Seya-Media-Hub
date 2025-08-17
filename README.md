# Seya Media Hub

Seya Media Hub is a lightweight multi-tenant media hosting and transformation service that uses Hetzner Object Storage for originals and variants and Cloudflare for global CDN delivery. This repository contains a minimal MVP with an API server, background worker and Next.js dashboard.

## A-Z Setup Guide

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-org/seya-media-hub.git
   cd seya-media-hub
   ```
2. **Create an environment file** by copying `.env.example` to `.env` and filling in values for MongoDB, Redis, Hetzner S3, Cloudflare and NextAuth secrets.
3. **Install dependencies** for all workspaces:
   ```bash
   npm install
   ```
4. **Start the stack** with Docker Compose:
   ```bash
   docker compose up --build
   ```
5. **Access the services** – the API runs on `http://localhost:8080` and the dashboard on `http://localhost:3000`.
6. **Sign up and create a tenant** using the dashboard or the `/v1/auth/signup` API, then create upload tokens and assets as needed.
7. **Configure Cloudflare** for CDN caching as described below.
8. **Configure Hetzner Object Storage** and connect the bucket to Cloudflare as the origin.

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
