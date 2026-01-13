# Mandatory Dependencies

This file documents dependencies that cannot be removed even if they appear unused.

## @prisma/client-runtime-utils

**Status:** MANDATORY - DO NOT REMOVE

**Reason:** App crashes with "Module not found: Can't resolve '@prisma/client-runtime-utils'"

**Date noted:** 2026-01-13

**Context:** This is required by Prisma runtime, even though it may not show up in static analysis tools like knip.
