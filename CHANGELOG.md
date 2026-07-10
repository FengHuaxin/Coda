# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.2] - 2026-07-03

### Fixed

- **Registry package name**: Fixed hardcoded `@huaxin/coda` in `platform/version/version.ts` that caused the version check and update hint to reference the wrong npm package name. Now correctly uses `@fenghuaxin/coda`.

## [0.1.1] - 2026-07-03

### Fixed

- **OpenSpec tool ID mapping**: Fixed incorrect OpenSpec tool IDs that caused `coda init` to fail with "Invalid tool(s)" errors:
  - Kimi Code: `kimi` → `kimicode` (OpenSpec 1.3.0+ uses `kimicode`)
  - Trae CN: `trae-cn` → `trae` (OpenSpec does not have a separate `trae-cn` tool)
- **Duplicate tool IDs**: Deduplicated `osToolIds` in `initCommand` to prevent OpenSpec from receiving duplicate entries when zcode/mimocode platforms reuse the `opencode` tool ID
- **OpenSpec retry logic**: Added automatic retry when OpenSpec reports unsupported tools. The installer now parses the "Invalid tool(s)" error, filters out unsupported tools, and retries with the remaining valid tools instead of failing entirely

### Technical Details

The root cause was a mismatch between Coda's platform definitions and OpenSpec's actual supported tool IDs. When `coda init` passed invalid tool IDs like `kimi` or `trae-cn`, OpenSpec would reject the entire command, causing all 32 platforms to fail. The fix includes:

1. Corrected tool ID mappings in `platform/install/platforms.ts`
2. Set deduplication in `app/commands/init.ts` using `new Set()`
3. Retry mechanism in `domains/integrations/openspec.ts` that catches "Invalid tool(s)" errors and automatically retries with filtered tool IDs

## [0.1.0] - 2026-07-03

Initial release.
