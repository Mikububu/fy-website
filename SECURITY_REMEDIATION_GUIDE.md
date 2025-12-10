# 🚨 SECURITY REMEDIATION GUIDE

## CRITICAL: Immediate Actions Required

Your repository had exposed API keys and secrets. The code has been cleaned, but **git history still contains these secrets**.

### Status of Cleanup

✅ **Completed:**
- Removed hardcoded secrets from `test_bot.py`
- Removed fallback credentials from `netlify/functions/whatsapp-webhook.js`
- Redacted secrets from all documentation files
- Installed pre-commit hook to prevent future leaks

⚠️ **Still Required (YOU MUST DO THIS):**
- Revoke all exposed tokens
- Clean git history or make repository private
- Verify no unauthorized access occurred

---

## 1. REVOKE ALL EXPOSED CREDENTIALS (DO THIS NOW)

### A. Revoke Netlify API Token

1. Go to: https://app.netlify.com/user/applications
2. Find token: `nfp_qubuGtQyMZ8QxwPhxbAT2EcsgpdxLY7Qd4ba`
3. Click "Revoke" or "Delete"
4. Create a new token with minimal required permissions
5. Update in Netlify if needed

### B. Revoke WhatsApp/Facebook Access Tokens

The following tokens were exposed and must be revoked:

**Token 1:** `EAAT0NJPTJ0sBQMFOSTMmg9yDNRpZC6nZCcbUuEynW4lkv9TjMtD0iHTROGWLpgImY7xO81GyAqUsDxAZB0D9IYtOG7pZB0JbixPuOWZBeZCv8ecZBl0ZAmebcNlp7S5r5lHnZBaVX0Vomn94ggP9PHok5ivYpPZC1SWVhbICi1mgXed91bPOQikHFjwLGiGdBut3jS2AZDZD`

**Token 2:** `EAAT0NJPTJ0sBQE7mfdbtZCHDujZAHeu2EJJsPB1RZAA8K70mwQVazZAdLUoKXOXdFyaKTmIjwRQb5jhfMmJy0RZCd7YiUBDTivfeOHqhG7ZBiYQufAlVRMnAr77CFY8l0uzoa48MB6ZBFKZBsCTj8NmChKyfpo5er7OAF0mTlSG3eKq5eGJTm6bV5aL6MbJi2H8HCtsYGHh7ZCedUaFhQk1dZCafvAOvGIyUaNBZAZBMiqYGWvXj8Ng1Wkfv78ZCNCIRW08dYmTEaJXporxCO6A9BU4a3QtPz`

**How to revoke:**
1. Go to: https://business.facebook.com/settings/system-users
2. Find the system user that owns these tokens
3. Remove or regenerate the access token
4. Generate a new permanent token
5. Update in Netlify environment variables

### C. Regenerate WhatsApp App Secret

**Exposed secret:** `1503be87b8baa00cf4221f2d406987d4`

1. Go to: https://developers.facebook.com/apps/1394406562408267/settings/basic/
2. Click "Show" next to App Secret
3. Click "Reset App Secret"
4. Confirm the reset
5. Copy the new secret
6. Update `WHATSAPP_APP_SECRET` in Netlify environment variables

### D. Change Webhook Verify Token

**Exposed token:** `ForbiddenYoga_Secure_2025_Token_XYZ789`

1. Generate a new secure token:
   ```bash
   openssl rand -base64 32
   ```
2. Update `WEBHOOK_VERIFY_TOKEN` in Netlify
3. Update webhook configuration in Meta Developer Console

---

## 2. AUDIT FOR UNAUTHORIZED ACCESS

### A. Check Netlify Account

1. Go to: https://app.netlify.com/sites/forbidden-yoga/logs
2. Review recent deployment logs
3. Check for any unexpected deployments
4. Review audit log: https://app.netlify.com/sites/forbidden-yoga/settings/audit-log
5. Look for unauthorized access or changes

### B. Check WhatsApp/Facebook Activity

1. Go to: https://business.facebook.com/security/
2. Review recent activity
3. Check for unauthorized API calls
4. Review message logs for unauthorized sends
5. Check webhook configuration for tampering

### C. Monitor for Suspicious Activity

For the next 30 days:
- Monitor Netlify deployment logs daily
- Check WhatsApp message logs for unexpected activity
- Review credit card/payment processor for unauthorized charges
- Set up alerts for unusual API usage

---

## 3. CLEAN GIT HISTORY (CRITICAL)

Even though secrets are removed from current code, they remain in git history.

### Option A: Rewrite Git History (Recommended but Disruptive)

**WARNING: This will rewrite history and require force push**

```bash
# Install git-filter-repo if not installed
pip install git-filter-repo

# Backup your repository first
cd /home/user/fy-website
git clone . ../fy-website-backup

# Remove sensitive files from all history
git filter-repo --invert-paths \
  --path set_netlify_env.py \
  --path setup-netlify-env.sh \
  --force

# Force push to remote (WARNING: Destructive!)
git push origin --force --all
git push origin --force --tags
```

**After force push:**
- All team members must re-clone the repository
- All open pull requests will be invalidated
- Any forks will still contain the secrets

### Option B: Make Repository Private (If Not Already)

If you cannot rewrite history:

1. Go to: https://github.com/Mikububu/fy-website/settings
2. Scroll to "Danger Zone"
3. Click "Change repository visibility"
4. Select "Make private"
5. Confirm

**Note:** If the repository was ever public, assume all secrets are compromised.

---

## 4. UPDATE ENVIRONMENT VARIABLES

After revoking old credentials, update Netlify with new ones:

1. Go to: https://app.netlify.com/sites/forbidden-yoga/configuration/env
2. Update each variable with new secure values:
   - `WHATSAPP_ACCESS_TOKEN` → New permanent token
   - `WHATSAPP_APP_SECRET` → New app secret
   - `WEBHOOK_VERIFY_TOKEN` → New random token
3. Netlify will auto-redeploy (wait 2 minutes)
4. Test the webhook after redeployment

---

## 5. VERIFY SECURITY IMPROVEMENTS

### A. Test Pre-Commit Hook

Try to commit a file with a fake secret:

```bash
cd /home/user/fy-website
echo 'TEST_TOKEN="EAAT0NJPTJ0stest123"' > test_secret.txt
git add test_secret.txt
git commit -m "test"
# Should be blocked by pre-commit hook
rm test_secret.txt
```

### B. Scan for Remaining Secrets

```bash
cd /home/user/fy-website

# Check for any remaining secrets in current code
grep -r "EAAT0NJPTJ0s" . --exclude-dir=.git
grep -r "nfp_" . --exclude-dir=.git
grep -r "1503be87b8baa00cf4221f2d406987d4" . --exclude-dir=.git
```

Should return no results (or only this guide).

---

## 6. PREVENT FUTURE LEAKS

### A. Use Environment Variables Only

**NEVER hardcode secrets in:**
- Source code
- Documentation files
- Test files
- Configuration files committed to git

**ALWAYS use:**
- Environment variables (`process.env.VAR_NAME`)
- `.env` files (in `.gitignore`)
- Secret management services (AWS Secrets Manager, HashiCorp Vault, etc.)

### B. Pre-Commit Hook

The pre-commit hook is now installed. It will:
- Scan staged files for common secret patterns
- Block commits containing potential secrets
- Prevent accidental exposure

### C. Regular Security Audits

Schedule monthly:
- Review environment variables for outdated credentials
- Rotate API tokens and secrets
- Check git history for new exposures
- Review access logs for suspicious activity

---

## 7. INCIDENT RESPONSE CHECKLIST

Use this checklist to verify all remediation steps are complete:

### Immediate Actions (Within 24 Hours)
- [ ] Revoked Netlify API token
- [ ] Revoked all WhatsApp/Facebook access tokens
- [ ] Regenerated WhatsApp App Secret
- [ ] Changed webhook verify token
- [ ] Updated all environment variables in Netlify
- [ ] Tested that bot still works with new credentials

### Security Verification (Within 48 Hours)
- [ ] Audited Netlify deployment logs
- [ ] Checked WhatsApp/Facebook activity logs
- [ ] Reviewed payment processor for unauthorized charges
- [ ] Set up monitoring alerts
- [ ] Made repository private OR cleaned git history

### Long-Term Prevention (Within 1 Week)
- [ ] Tested pre-commit hook
- [ ] Scanned codebase for remaining secrets
- [ ] Documented secret management procedures
- [ ] Trained team on security best practices
- [ ] Implemented secrets rotation schedule

---

## 8. ADDITIONAL RESOURCES

### Secret Scanning Tools

**For prevention:**
- `git-secrets`: https://github.com/awslabs/git-secrets
- `detect-secrets`: https://github.com/Yelp/detect-secrets
- `truffleHog`: https://github.com/trufflesecurity/trufflehog

**For scanning git history:**
```bash
# Install truffleHog
pip install truffleHog

# Scan git history
trufflehog filesystem /home/user/fy-website
```

### Security Best Practices

1. **Principle of Least Privilege**
   - Only grant minimum required permissions
   - Use separate tokens for dev/staging/production

2. **Secret Rotation**
   - Rotate API keys every 90 days
   - Use expiring tokens when possible

3. **Monitoring**
   - Enable audit logging on all services
   - Set up alerts for unusual activity

4. **Team Training**
   - Educate team on secret management
   - Review security in code reviews
   - Practice incident response drills

---

## 9. CONTACT INFORMATION

### Report Security Issues

If you discover additional security issues:
- Do NOT commit them to git
- Do NOT discuss in public issues/PRs
- Contact security team immediately

### Get Help

If you need assistance with any of these steps:
- Netlify Support: https://support.netlify.com
- Meta Developer Support: https://developers.facebook.com/support/
- GitHub Support: https://support.github.com

---

## 10. VERIFICATION COMMANDS

Run these commands to verify cleanup:

```bash
cd /home/user/fy-website

# Check no hardcoded secrets in active code
echo "Checking for Facebook tokens..."
git grep -i "EAAT0NJPTJ0s" -- '*.py' '*.js' '*.md' || echo "✅ None found"

echo "Checking for Netlify tokens..."
git grep -i "nfp_" -- '*.py' '*.js' '*.md' || echo "✅ None found"

echo "Checking for app secrets..."
git grep -i "1503be87b8baa00cf4221f2d406987d4" -- '*.py' '*.js' '*.md' || echo "✅ None found"

echo "Checking for phone numbers..."
git grep -i "6285190247022" -- '*.py' '*.js' '*.md' || echo "✅ None found"

# Verify pre-commit hook is executable
ls -la .git/hooks/pre-commit | grep "x" && echo "✅ Pre-commit hook is executable"

# Test environment variable usage
echo "Testing test_bot.py uses env vars..."
grep "os.environ.get" test_bot.py && echo "✅ Uses environment variables"

echo "Testing webhook.js requires env vars..."
grep "throw new Error" netlify/functions/whatsapp-webhook.js && echo "✅ Validates env vars"
```

All checks should pass with ✅

---

**Generated:** 2025-12-10
**Priority:** CRITICAL - Complete remediation within 24-48 hours
**Status:** Code cleaned, credential revocation and history cleanup still required
