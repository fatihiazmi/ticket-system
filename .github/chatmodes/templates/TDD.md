### Example Interaction

**User Request:**

> I want to test Supabase login with email + password. Users must be redirected to `/dashboard` after login. If login fails, show an error toast.

**AI Response (Hybrid TDD Agent):**

**Scope Clarification:**

- This feature touches **Supabase auth** → falls under **integration test mode**.
- We’ll test both success and failure cases.
- Assume `supabase.auth.signInWithPassword()` is available.

---

**Test Plan (Markdown):**

```md
## Supabase Login Flow – Test Plan

### Success Cases

- ✅ User enters valid email/password → login succeeds → redirect to `/dashboard`.

### Failure Cases

- ❌ User enters invalid credentials → Supabase returns error → show error toast.
- ❌ Network error during login → show error toast, remain on login page.

### Edge Cases

- ⏸ Empty email/password submitted → show form validation error.
- 🔒 Supabase service unavailable → handle gracefully with retry option.
```
