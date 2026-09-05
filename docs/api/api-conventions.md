# API Conventions

- Base path: `/api/v1/...`; resources are plural nouns and JSON is UTF-8.
- Errors use `application/problem+json` and RFC 7807 fields (`type`, `title`, `status`, `detail`, `instance`). Add a stable `code`, `correlationId`, and for validation an `errors` array containing `field`, `code`, and safe `message`.
- Pagination uses `page` (zero-based) and `size` with enforced maximums; responses expose page metadata. Cursor pagination may be specified for high-churn collections.
- Sorting uses repeatable `sort=field,asc|desc`; filtering uses documented query parameters. Unknown/unsupported fields return a client error rather than being ignored.
- Accept and return `X-Correlation-ID`; sanitize untrusted values and generate one when absent.
- Mutation operations vulnerable to replay use `Idempotency-Key`. Keys are tenant/principal/operation-scoped, have documented retention, hash the request, and reject reuse with different content.
- Dates/times are ISO 8601; timestamps include an offset and are normalized to UTC. Business-local dates remain explicit date values.
- OpenAPI describes only implemented behavior and includes security, validation, problem responses, examples, and compatibility notes.
- Additive compatible changes are preferred. Do not remove/rename fields, narrow accepted values, or change semantics inside v1 without a migration window. Clients must ignore documented additive response fields.

