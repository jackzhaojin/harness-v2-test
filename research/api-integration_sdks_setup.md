# SDK Setup and Usage

**Topic ID:** api-integration.sdks.setup
**Researched:** 2026-03-01T00:00:00Z

## Overview

Software Development Kits (SDKs) provide pre-built libraries that simplify API integration by handling authentication, request formatting, response parsing, and error handling. Rather than making raw HTTP calls, developers use typed methods that abstract away protocol details while providing compile-time safety and better IDE support.

Modern SDKs typically offer synchronous and asynchronous clients, automatic retry logic with exponential backoff, streaming support, and type-safe request/response handling. The setup process involves installing the SDK package, configuring API credentials securely, and initializing a client instance with appropriate settings for timeouts, retries, and other behaviors.

Understanding SDK configuration is critical because defaults rarely suit production requirements. Misconfigured retry policies can cause cascading failures, hardcoded API keys create security vulnerabilities, and improper timeout settings degrade user experience. A properly configured SDK handles transient failures gracefully while failing fast on permanent errors.

## Key Concepts

- **Client Initialization** — Creating an SDK client instance with credentials and configuration. Most SDKs support environment variable-based configuration as the default, with programmatic overrides for testing and special cases.

- **API Key Management** — Securely storing and providing credentials to the SDK. Best practice is using environment variables locally (with `.env` files excluded from version control) and secrets managers (AWS Secrets Manager, GCP Secret Manager, Azure Key Vault) in production.

- **Type-Safe Clients** — SDKs generated from OpenAPI specifications that provide compile-time type checking for requests and responses. Tools like `openapi-typescript`, Kiota, and Stainless generate clients where the compiler validates that your code matches the API contract.

- **Runtime Validation** — Additional validation layer using libraries like Zod (TypeScript) or Pydantic (Python) to verify API responses match expected schemas at runtime, since type systems only check at compile time.

- **Retry Strategy** — Configuration that determines which errors trigger automatic retries, maximum retry attempts, and delay calculation (typically exponential backoff with jitter). Standard retryable conditions include HTTP 408, 429, and 5xx status codes.

- **Exponential Backoff with Jitter** — Delay calculation that increases wait time between retries (e.g., 1s, 2s, 4s) with randomization to prevent thundering herd problems when many clients retry simultaneously.

- **Circuit Breaker Pattern** — Complementary pattern that stops retry attempts when a service is consistently failing, preventing resource exhaustion and allowing the service to recover.

- **Idempotency** — Property where repeating an operation produces the same result. Critical consideration for retry logic—non-idempotent operations (like creating resources) require idempotency keys or careful handling.

## Technical Details

### Installation Patterns

Python SDKs typically install via pip with optional extras for platform-specific integrations:

```bash
# Basic installation
pip install anthropic

# With platform integrations
pip install anthropic[bedrock]    # AWS Bedrock support
pip install anthropic[vertex]     # Google Vertex AI support
pip install anthropic[aiohttp]    # Improved async performance
```

TypeScript/Node SDKs install via npm:

```bash
npm install openai
npm install @anthropic-ai/sdk
```

### Client Configuration

Initialize clients with credentials from environment variables, not hardcoded values:

```python
import os
from anthropic import Anthropic

# Recommended: API key from environment variable
client = Anthropic(
    api_key=os.environ.get("ANTHROPIC_API_KEY"),
)

# Configure retries and timeouts
client = Anthropic(
    api_key=os.environ.get("ANTHROPIC_API_KEY"),
    max_retries=3,          # Default is 2
    timeout=30.0,           # Default is 10 minutes
)
```

For granular timeout control:

```python
import httpx
from anthropic import Anthropic

client = Anthropic(
    timeout=httpx.Timeout(60.0, read=5.0, write=10.0, connect=2.0),
)
```

### Type-Safe API Clients with OpenAPI

Generate TypeScript types from an OpenAPI specification:

```bash
npx openapi-typescript https://api.example.com/openapi.json -o schema.ts
```

Use the generated types for compile-time safety:

```typescript
import { paths } from './schema';

type GetPetsRequest = paths['/pets']['get']['parameters'];
type GetPetsResponse = paths['/pets']['get']['responses']['200']['content']['application/json'];

export const getPets = ({ params }: { params: GetPetsRequest }) =>
  apiClient.request<GetPetsResponse>({
    method: 'GET',
    url: '/pets',
    params: { limit: params.query?.limit }
  });
```

### Error Handling

SDKs provide typed exceptions for different failure modes:

```python
import anthropic
from anthropic import Anthropic

client = Anthropic()

try:
    message = client.messages.create(...)
except anthropic.APIConnectionError as e:
    print("Network error - check connectivity")
except anthropic.RateLimitError as e:
    print("Rate limited - implement backoff")
except anthropic.AuthenticationError as e:
    print("Invalid API key - check credentials")
except anthropic.APIStatusError as e:
    print(f"API error: {e.status_code}")
```

| Status Code | Error Type | Retryable |
|-------------|-----------|-----------|
| 400 | BadRequestError | No |
| 401 | AuthenticationError | No |
| 403 | PermissionDeniedError | No |
| 429 | RateLimitError | Yes |
| 5xx | InternalServerError | Yes |

### Async Usage

Modern SDKs provide async clients for concurrent operations:

```python
import asyncio
from anthropic import AsyncAnthropic

client = AsyncAnthropic()

async def main():
    message = await client.messages.create(
        model="claude-opus-4-6",
        max_tokens=1024,
        messages=[{"role": "user", "content": "Hello"}]
    )
    print(message.content)

asyncio.run(main())
```

## Common Patterns

### Environment-Based Configuration

Separate credentials per environment using environment variables:

```bash
# Development (.env file - add to .gitignore!)
ANTHROPIC_API_KEY=sk-dev-xxx

# Production (via secrets manager)
export ANTHROPIC_API_KEY=$(aws secretsmanager get-secret-value --secret-id prod/anthropic-key --query SecretString --output text)
```

### Backend Proxy Pattern

Keep API keys out of client-side code by routing through a backend:

```
Client → Your Backend (adds API key) → External API
```

This ensures clients never see credentials, enables centralized rate limiting, and allows credential rotation without client updates.

### Request ID Logging

Capture request IDs for debugging and support tickets:

```python
message = client.messages.create(...)
print(f"Request ID: {message._request_id}")  # e.g., req_018EeWyXxfu5pfWkrYcMdjWG
```

### Streaming for Long Operations

Use streaming to avoid timeout issues on long-running requests:

```python
stream = client.messages.create(
    model="claude-opus-4-6",
    max_tokens=4096,
    messages=[{"role": "user", "content": "Write a long essay..."}],
    stream=True,
)
for event in stream:
    print(event.type)
```

## Gotchas

- **Don't layer retry logic** — If you add application-level retries on top of SDK retries, you get multiplicative retry attempts (e.g., 3 × 3 = 9 attempts) with compounding delays. Configure retries at one layer only.

- **TypeScript type safety is compile-time only** — After compilation to JavaScript, no type information remains. API responses could have unexpected shapes at runtime. Consider adding Zod validation for critical paths.

- **Environment variables aren't automatically loaded** — Python requires `python-dotenv` to load `.env` files; they don't load automatically. Add `load_dotenv()` early in your application.

- **Default timeouts may be too long** — Some SDKs default to 10-minute timeouts. This is appropriate for AI generation APIs but too long for typical REST endpoints. Always configure explicit timeouts.

- **Retry storms can cascade** — Aggressive retry policies with many clients can overwhelm a recovering service. Use exponential backoff with jitter, and consider circuit breakers for persistent failures.

- **API key rotation requires planning** — Keys should be rotated every 30-90 days. Ensure your deployment process supports seamless rotation without downtime.

- **GitHub Secret Scanning** — Anthropic and other providers partner with GitHub to automatically detect and revoke exposed keys in public repositories. This helps, but prevention (proper .gitignore, environment variables) is better than detection.

- **Connection timeouts vs request timeouts** — Connection timeout applies to establishing the TCP connection; request timeout applies to the entire request/response cycle. Configure both appropriately.

- **Non-idempotent operations need care** — Retrying a POST that creates a resource might create duplicates. Use idempotency keys when the API supports them, or implement client-side deduplication.

## Sources

- [Google Cloud - Best practices for managing API keys](https://docs.cloud.google.com/docs/authentication/api-keys-best-practices) — API key restrictions, rotation, and security recommendations
- [Claude Help Center - API Key Best Practices](https://support.claude.com/en/articles/9767949-api-key-best-practices-keeping-your-keys-safe-and-secure) — Environment variable usage, secrets managers, key rotation schedules
- [Anthropic Python SDK Documentation](https://platform.claude.com/docs/en/api/sdks/python) — Complete SDK installation, configuration, async usage, streaming, and error handling
- [DEV Community - Writing Type-Safe API Clients in TypeScript](https://dev.to/nazeelashraf/writing-type-safe-api-clients-in-typescript-1j92) — OpenAPI code generation and type-safe client patterns
- [AWS PDK - Type Safe API](https://aws.github.io/aws-pdk/developer_guides/type-safe-api/index.html) — Multi-language code generation from API specifications
- [Microsoft Azure - Retry Pattern](https://learn.microsoft.com/en-us/azure/architecture/patterns/retry) — Retry strategies, exponential backoff, circuit breaker integration, and when not to retry
