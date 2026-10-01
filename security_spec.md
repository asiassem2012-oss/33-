# Security Specification — Life Labs Mansoura (معامل الحياة للتحاليل الطبية)

## 1. Data Invariants

1. **Default-Deny Catch-All**: Every path not explicitly matched under `/databases/{database}/documents` is unconditionally denied (`allow read, write: if false;`).
2. **PII Split-Collection Isolation**:
   - `/results/{analysisCode}` contains only the clinical test status and PDF report metadata needed when a patient queries their exact `analysisCode` (`^LAB-[0-9]{4}-[0-9]{3,6}$`). Bulk listing (`allow list`) on `/results` is strictly restricted to verified Lab Administrators (`isAdmin()`).
   - `/result_contacts/{analysisCode}` isolates patient phone numbers (`patientPhone`) and internal staff notes (`notes`). Read and write access is strictly restricted to `isAdmin()`. Furthermore, creating a `/result_contacts/{analysisCode}` record requires atomic or existing presence of `/results/{analysisCode}` via `existsAfter()`.
3. **Home Sample Collection PII Protection (`/home_requests/{requestId}`)**:
   - Contains patient phone number, street address in Mansoura, and optional prescription image.
   - Only verified authenticated users (`request.auth.token.email_verified == true`) can create a request where `requesterId == request.auth.uid` and initial `status == 'new'`.
   - `get` and `list` operations strictly verify `resource.data.requesterId == request.auth.uid || isAdmin()`.
   - Terminal states (`completed`, `cancelled`) lock out non-admin modifications.
4. **Strict Key & Volumetric Boundaries**:
   - Every entity validation helper (`isValidAdminRecord`, `isValidLabResult`, `isValidResultContact`, `isValidHomeRequest`) enforces `keys().hasAll(...)` and `keys().hasOnly(...)`, explicit type checks, `.size()` bounds on every string, regex format checks on IDs, and `request.time` equality on timestamps.

## 2. The "Dirty Dozen" Payloads

1. **Shadow Field Injection on LabResult**:
   ```json
   {
     "analysisCode": "LAB-2026-889",
     "patientName": "أحمد محمد علي",
     "testName": "صورة دم كاملة CBC",
     "testCategory": "أمراض الدم",
     "testDate": "2026-10-01",
     "status": "ready",
     "estimatedCompletion": "",
     "pdfDataUrl": "",
     "pdfFileName": "",
     "clinicalSummary": "Normal",
     "createdBy": "admin_1",
     "isSuperAdmin": true
   }
   ```
2. **Unverified Admin Email Spoof**:
   Authenticated token with `email: "asiassem2012@gmail.com"` but `email_verified: false` attempting to create `/results/LAB-2026-999`.
3. **Public Scraping (`list`) of `/results`**:
   Unauthenticated or non-admin user executing a collection-wide `getDocs(collection(db, 'results'))` to enumerate patient analysis codes.
4. **Unauthorized Read of Isolated PII (`/result_contacts/LAB-2026-889`)**:
   Non-admin authenticated user attempting `getDoc(doc(db, 'result_contacts', 'LAB-2026-889'))` to harvest a patient's phone number.
5. **Orphaned Contact PII Write**:
   Admin attempting to create `/result_contacts/LAB-2026-777` when `/results/LAB-2026-777` does not exist after the transaction (`existsAfter` check fails).
6. **Identity Spoofing on Home Collection Request**:
   User `user_A` attempting to create `/home_requests/req_101` with `"requesterId": "user_B"`.
7. **State Shortcutting on Home Collection Request Creation**:
   User `user_A` creating `/home_requests/req_102` with initial `"status": "completed"` instead of `"new"`.
8. **Terminal State Bypass on Home Collection Request Update**:
   User `user_A` attempting to update `/home_requests/req_102` after `status` is already `"completed"`.
9. **Unauthorized Update of Immutable Fields (`createdAt` / ` requesterId`)**:
   Admin or owner attempting to mutate `createdAt` or `requesterId` during an `update` operation on `/home_requests/req_101`.
10. **ID Poisoning Attack**:
    Attempting to read or create `/results/INVALID_CODE_WITH_SPACES_AND_SYMBOLS!@#` that violates `^LAB-[0-9]{4}-[0-9]{3,6}$`.
11. **Value Poisoning / Denial of Wallet String Overflow**:
    Submitting a `/home_requests/req_103` payload where `patientName` is a 5,000-character string exceeding `maxLength: 120`.
12. **Client Timestamp Forgery**:
    Submitting a `create` or `update` where `createdAt` or `updatedAt` is a past/future timestamp (`2020-01-01T00:00:00Z`) rather than `request.time`.
