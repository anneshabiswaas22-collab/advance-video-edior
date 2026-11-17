# OpenReel Cloud API

Cloudflare Worker API for OpenReel template storage and sharing.

## Security recovery status

**Do not deploy this optional service as a public production API.** No
server-verified identity provider or reviewer authorization policy is configured.
Protected marketplace authoring, review/publication, installs, account reads,
financial events, AI highlight generation, and legacy template upload/deletion therefore return
`503 {"error":"authentication_not_configured"}` before storage access. Caller
Bearer tokens and `X-User-Id` / `X-Creator-Id` headers cannot enable them, even in
development or test. There is no development authentication bypass.

Public catalog reads, explicitly public sharing, health and crash endpoints keep
their separate behavior; this change does not certify those surfaces safe for
public deployment. In particular public upload abuse still needs review. AI highlighting
remains disabled pending verified identity and an explicit usage/cost policy. Re-enabling protected routes requires verified identity, ownership,
separate reviewer permissions and negative authorization tests, plus a separately
verified revenue/event trust model. Header-only identity and the old
self-publication test are not an authentication implementation.

Run local checks from `editor/`:

```bash
pnpm --filter cloud test:run
pnpm --filter cloud typecheck
```

The tests exercise forged headers and missing identity in production, development,
test and unconfigured environments; confirm rejected calls do not touch storage;
and keep representative public catalog reads covered. Exact pre-fix originals
and hashes are retained in
`AnalyseFuture/historical-implementations/security-recovery/cloud-originals.json`
from the repository root.


## Features

- **Template Storage**: Upload is disabled pending verified authentication
- **Template Listing**: Browse all available templates
- **Template Download**: Download individual templates
- **Template Deletion**: Disabled pending verified authentication and ownership checks

## Setup

### 1. Create R2 Bucket

```bash
cd apps/cloud
npx wrangler r2 bucket create openreel-templates
```

### 2. Deployment is blocked

Complete authentication/authorization and the remaining public-surface security
review before separately authorizing a deployment. Local tests do not deploy the Worker.

## API Endpoints

### GET `/`
Get API information and available endpoints.

**Response:**
```json
{
  "name": "OpenReel Cloud API",
  "version": "1.0.0",
  "endpoints": {
    "templates": {
      "list": "GET /templates",
      "get": "GET /templates/:id",
      "upload": "POST /templates",
      "delete": "DELETE /templates/:id"
    }
  }
}
```

### GET `/templates`
List all templates.

**Query Parameters:**
- `cursor` (optional): Pagination cursor

**Response:**
```json
{
  "templates": [
    {
      "id": "template-123",
      "name": "My Template",
      "category": "youtube",
      "description": "A cool template",
      "thumbnailUrl": null,
      "placeholderCount": 2,
      "duration": 30,
      "createdAt": 1234567890,
      "tags": ["intro", "animated"],
      "author": "username"
    }
  ],
  "cursor": "next-page-token",
  "truncated": false
}
```

### GET `/templates/:id`
Get a specific template by ID.

**Response:**
```json
{
  "id": "template-123",
  "name": "My Template",
  "description": "A cool template",
  "category": "youtube",
  "settings": {
    "width": 1920,
    "height": 1080,
    "frameRate": 30
  },
  "timeline": {
    "tracks": [...],
    "graphics": {...}
  },
  "placeholders": [...]
}
```

### POST `/templates`
Disabled: currently returns HTTP 503 before parsing a body or accessing storage.
The request/response below describes the retained implementation, not an enabled API.

**Request Body:**
```json
{
  "id": "template-123",
  "name": "My Template",
  "description": "Description",
  "category": "youtube",
  "timeline": {...},
  "placeholders": [...],
  "tags": ["intro"],
  "author": "username"
}
```

**Response:**
```json
{
  "success": true,
  "id": "template-123",
  "message": "Template uploaded successfully"
}
```

### DELETE `/templates/:id`
Disabled: currently returns HTTP 503 before accessing storage.
The response below describes the retained implementation, not an enabled API.

**Response:**
```json
{
  "success": true,
  "message": "Template deleted successfully"
}
```

### GET `/health`
Health check endpoint.

**Response:**
```json
{
  "status": "healthy",
  "timestamp": 1234567890
}
```

## R2 Configuration

The worker uses Cloudflare R2 for storage with the following configuration:

- **Bucket Name**: `openreel-templates`
- **Binding**: `TEMPLATES_BUCKET`
- **Access**: Via Cloudflare Workers R2 API (no direct S3 access needed)

## CORS

CORS is configured to allow requests from:
- `http://localhost:5173` (local development)
- `https://app.openreel.video` (production)
- `https://*.openreel-3pq.pages.dev` (Cloudflare Pages previews)

## Local Development

```bash
npm run dev
```

The worker will be available at `http://localhost:8787`

## Environment Variables

Set in `wrangler.jsonc`:
- `ENVIRONMENT`: `production` or `development`

## Security Notes

- Built-in templates (IDs starting with `builtin-`) cannot be deleted
- Template IDs must be unique
- All uploads are validated for required fields (id, name, timeline)
- CORS is restricted to OpenReel domains only
