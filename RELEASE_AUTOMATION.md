# Release Automation Instructions

1. Install standard-version in both backend and frontend:
   cd backend && npm install --save-dev standard-version
   cd ../frontend && npm install --save-dev standard-version

2. To create a new release:
   - Run `npm run release` in backend or frontend.
   - This will bump the version, update CHANGELOG.md, and create a git tag.

3. Push tags to GitHub to trigger release workflows or GitHub Releases.

4. Optionally, automate this in CI for main branch merges.

# See https://github.com/conventional-changelog/standard-version for more options.

