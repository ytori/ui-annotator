# Secure Review, Commit & Push

Perform a security review, commit, and push changes to remote.

## Instructions

1. **Security Review**: Check all staged/unstaged changes for sensitive information:
   - API keys, tokens, secrets (e.g., `sk-`, `api_key`, `secret`, `password`)
   - Private keys (e.g., `-----BEGIN PRIVATE KEY-----`)
   - Personal information (email addresses, phone numbers, physical addresses)
   - Credentials in config files (`.env` values accidentally committed)
   - Hardcoded URLs with authentication tokens
   - Internal/private IP addresses or hostnames

2. **Code Review**: Briefly review the changes for:
   - Obvious bugs or issues
   - Unintended file inclusions
   - Debug code or console.log statements that should be removed

3. **Report Findings**: If any issues are found:
   - List all problematic files and line numbers
   - Describe the issue and recommended fix
   - **DO NOT proceed with commit/push** until user confirms fixes

4. **Commit**: If no issues found (or after user confirmation):
   - Stage all relevant changes
   - Create a descriptive commit message following conventional commits

5. **Push Confirmation**: After successful commit:
   - Ask the user whether to push to remote
   - Only push if user explicitly confirms

## Commit Message Guidelines

- Use conventional commit format: `type(scope): description`
- Types: `feat`, `fix`, `refactor`, `docs`, `style`, `test`, `chore`
- Keep the subject line under 50 characters
- Add body if needed for complex changes
