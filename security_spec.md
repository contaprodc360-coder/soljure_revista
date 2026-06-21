# Security Specification for CONTAPRO DC

## Data Invariants
- An editorial must have a title, content, author, and area.
- `createdAt` and `updatedAt` must be server timestamps.
- `authorId` must match the publishing user's UID.
- Only admins can create/update/delete editorials.

## The Dirty Dozen Payloads (Target: /editorials)
1. **Empty Payload**: Attempt to create an editorial with `{}`. Result: `PERMISSION_DENIED`.
2. **Missing Fields**: Missing `title` or `content`. Result: `PERMISSION_DENIED`.
3. **Invalid Types**: `title` as a boolean. Result: `PERMISSION_DENIED`.
4. **Huge Content**: `title` over 500 chars or content over 1MB. Result: `PERMISSION_DENIED`.
5. **Identity Spoofing**: Setting `authorId` to a different user's UID. Result: `PERMISSION_DENIED`.
6. **Future/Past Timestamps**: Setting `createdAt` to a client-provided time. Result: `PERMISSION_DENIED`.
7. **Unauthenticated Write**: Attempt to create without signing in. Result: `PERMISSION_DENIED`.
8. **Malicious ID**: Using a 2KB string as `editorialId`. Result: `PERMISSION_DENIED`.
9. **Shadow Fields**: Adding `isPromoted: true` to a standard update. Result: `PERMISSION_DENIED`.
10. **Admin Escalation**: Attempt to write to `/admins/` collection. Result: `PERMISSION_DENIED`.
11. **State Poisoning**: Changing `area` to a non-enum value. Result: `PERMISSION_DENIED`.
12. **Immutable Field Change**: Attempt to change `createdAt` on update. Result: `PERMISSION_DENIED`.

## The Test Runner
A `firestore.rules.test.ts` will be implemented to verify these constraints.
