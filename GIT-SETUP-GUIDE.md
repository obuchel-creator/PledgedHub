# Version Control Setup Guide

## Git Configuration for PledgeHub

### Initial Setup (First Time Only)

```powershell
# Navigate to project root
cd c:\Users\HP\PledgeHub

# Initialize Git repository (if not already done)
git init

# Configure your identity
git config user.name "Your Name"
git config user.email "your.email@example.com"

# Set default branch name to main
git config init.defaultBranch main
```

### Create Initial Commit

```powershell
# Check status
git status

# Add all files (respecting .gitignore)
git add .

# Create initial commit
git commit -m "Initial commit: PledgeHub with advanced reminders and mobile money"

# Verify commit
git log --oneline
```

### Branch Strategy

```powershell
# Create development branch
git checkout -b development

# Create feature branches for new work
git checkout -b feature/payment-integration
git checkout -b feature/security-enhancements
git checkout -b feature/elderly-ui

# Create hotfix branch for urgent fixes
git checkout -b hotfix/security-patch
```

### Daily Workflow

```powershell
# 1. Start of day - update your branch
git checkout development
git pull origin development

# 2. Create feature branch
git checkout -b feature/your-feature-name

# 3. Make changes and commit frequently
git add .
git commit -m "Add mobile money payment service"

# 4. Push your branch
git push -u origin feature/your-feature-name

# 5. When ready, merge to development
git checkout development
git merge feature/your-feature-name

# 6. Push to remote
git push origin development
```

### Useful Git Commands

```powershell
# View changes
git status                  # See what changed
git diff                    # See detailed changes
git log --oneline           # See commit history

# Undo changes
git restore filename        # Discard changes to file
git restore .               # Discard all changes
git reset --soft HEAD~1     # Undo last commit (keep changes)
git reset --hard HEAD~1     # Undo last commit (discard changes)

# Branch management
git branch                  # List local branches
git branch -a               # List all branches
git branch -d branch-name   # Delete branch
git checkout branch-name    # Switch branch

# Stash changes
git stash                   # Save changes temporarily
git stash pop               # Restore stashed changes
git stash list              # List all stashes

# Remote repository
git remote add origin <url> # Add remote repository
git push -u origin main     # Push to remote (first time)
git push                    # Push subsequent changes
git pull                    # Get latest changes
```

### Setup GitHub/GitLab Repository

#### Option 1: GitHub

```powershell
# 1. Create repository on GitHub.com
# 2. Link to your local repository
git remote add origin https://github.com/yourusername/pledgehub.git

# 3. Push initial code
git branch -M main
git push -u origin main

# 4. Push development branch
git checkout development
git push -u origin development
```

#### Option 2: GitLab

```powershell
# 1. Create project on GitLab.com
# 2. Link to your local repository
git remote add origin https://gitlab.com/yourusername/pledgehub.git

# 3. Push initial code
git branch -M main
git push -u origin main
```

### Branch Protection Rules (Recommended)

For GitHub/GitLab, set these rules on `main` and `development` branches:

1. **Require pull request reviews** before merging
2. **Require status checks** to pass (tests)
3. **Prevent direct pushes** to main
4. **Require signed commits** (optional, for security)

### Commit Message Guidelines

Use clear, descriptive commit messages:

```bash
# Good examples:
git commit -m "Add MTN Mobile Money payment integration"
git commit -m "Fix security vulnerability in auth middleware"
git commit -m "Update elder-friendly payment UI with large buttons"
git commit -m "Add CSRF protection to payment endpoints"

# Bad examples:
git commit -m "fixed stuff"
git commit -m "update"
git commit -m "changes"
```

### Commit Message Format (Optional - Conventional Commits)

```
<type>(<scope>): <subject>

[optional body]

[optional footer]
```

Types:
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting)
- `refactor`: Code refactoring
- `perf`: Performance improvements
- `test`: Adding tests
- `chore`: Maintenance tasks
- `security`: Security improvements

Examples:
```bash
git commit -m "feat(payment): add MTN Mobile Money integration"
git commit -m "security(auth): implement rate limiting"
git commit -m "fix(reminders): correct timezone calculation"
```

### Git Workflow for Teams

```
main (production)
  ↑
  └── development (staging)
        ↑
        ├── feature/payment-api
        ├── feature/security
        └── feature/elderly-ui
```

**Flow:**
1. Create feature branch from `development`
2. Work on feature, commit frequently
3. Push feature branch
4. Create Pull Request to `development`
5. Code review
6. Merge to `development`
7. Test on development/staging
8. When stable, merge `development` → `main`
9. Deploy `main` to production

### Ignoring Sensitive Files

**CRITICAL**: Never commit these files:
- `.env` files (contain API keys, passwords)
- `node_modules/` (too large)
- `logs/` (contain sensitive data)
- `coverage/` (test artifacts)
- Database dumps with real data

Already configured in `.gitignore`

### Check What Will Be Committed

```powershell
# Before committing, always check:
git status

# Make sure these are NOT staged:
# - .env files
# - node_modules/
# - logs/
# - sensitive data

# If accidentally staged, unstage:
git restore --staged .env
```

### Emergency: Remove Committed Secrets

If you accidentally committed `.env` or secrets:

```powershell
# 1. Remove from Git history (DANGEROUS - rewrites history)
git filter-branch --force --index-filter \
  "git rm --cached --ignore-unmatch backend/.env" \
  --prune-empty --tag-name-filter cat -- --all

# 2. Force push (if already pushed to remote)
git push origin --force --all

# 3. IMMEDIATELY rotate all compromised secrets:
# - Change all API keys
# - Change all passwords
# - Regenerate JWT secrets
```

### Collaboration Tips

1. **Pull before push**: Always `git pull` before `git push`
2. **Commit often**: Small, focused commits are better
3. **Write clear messages**: Explain what and why
4. **Review before commit**: Check `git diff` before committing
5. **Test before merge**: Ensure code works before merging
6. **Use branches**: Never work directly on `main`

### Deployment Workflow

```powershell
# Development → Staging
git checkout development
git pull origin development
# Deploy to staging server
# Test thoroughly

# Staging → Production (when stable)
git checkout main
git merge development
git push origin main
# Deploy to production server
```

### Quick Reference

| Task | Command |
|------|---------|
| Check status | `git status` |
| See changes | `git diff` |
| Add all files | `git add .` |
| Commit | `git commit -m "message"` |
| Push | `git push` |
| Pull | `git pull` |
| New branch | `git checkout -b name` |
| Switch branch | `git checkout name` |
| Merge branch | `git merge name` |
| Undo changes | `git restore .` |
| View history | `git log --oneline` |

### Resources

- **Git Documentation**: https://git-scm.com/doc
- **GitHub Guides**: https://guides.github.com
- **GitLab Docs**: https://docs.gitlab.com
- **Conventional Commits**: https://www.conventionalcommits.org

---

**Next Steps:**

1. ✅ `.gitignore` already configured
2. Initialize Git: `git init`
3. Make first commit: `git add . && git commit -m "Initial commit"`
4. Create GitHub/GitLab repository
5. Push code: `git push -u origin main`
6. Create `development` branch
7. Set up branch protection rules
8. Start using feature branches for new work

