# Publishing EdgeCraft to npm

This guide will help you publish the EdgeCraft package to npm.

## Prerequisites

1. **npm account**: Create one at [npmjs.com](https://www.npmjs.com/signup)
2. **npm CLI**: Already installed with Node.js
3. **Git**: For version control

## Initial Setup

### 1. Login to npm

```bash
npm login
```

Enter your npm credentials when prompted.

### 2. Verify Your Package Name

Check if "edgecraft" is available:

```bash
npm search edgecraft
```

If the name is taken, update `package.json` with a different name or use a scoped package:

```json
{
  "name": "@yourusername/edgecraft",
  ...
}
```

### 3. Update package.json

Before publishing, update these fields:

```json
{
  "author": "Your Name <your.email@example.com>",
  "repository": {
    "type": "git",
    "url": "https://github.com/yourusername/edgecraft.git"
  },
  "bugs": {
    "url": "https://github.com/yourusername/edgecraft/issues"
  },
  "homepage": "https://github.com/yourusername/edgecraft#readme"
}
```

## Building the Package

### 1. Install Dependencies

```bash
npm install
```

### 2. Build the Package

```bash
npm run build
```

This will:
- Compile TypeScript to JavaScript
- Generate type declarations
- Create both CommonJS and ES Module bundles
- Output everything to the `dist/` folder

### 3. Test the Build

Verify that the build was successful:

```bash
ls dist/
# Should show: index.js, index.esm.js, index.d.ts, and .map files
```

## Publishing

### First-Time Publishing

```bash
# Build the package
npm run build

# Publish to npm
npm publish
```

For scoped packages (if using @yourusername/edgecraft):

```bash
npm publish --access public
```

### Publishing Updates

1. **Update the version** in `package.json`:

```bash
# Patch release (0.1.0 -> 0.1.1)
npm version patch

# Minor release (0.1.0 -> 0.2.0)
npm version minor

# Major release (0.1.0 -> 1.0.0)
npm version major
```

2. **Publish**:

```bash
npm publish
```

## Testing Before Publishing

### 1. Test Locally with npm link

```bash
# In the edgecraft directory
npm link

# In a test project directory
npm link edgecraft

# Now you can import it
# import { EdgeCraft } from 'edgecraft';
```

### 2. Test the Package Tarball

Create a tarball to see what will be published:

```bash
npm pack
```

This creates a `.tgz` file. You can:
- Extract it to verify contents
- Install it in another project: `npm install ./edgecraft-0.1.0.tgz`

## Continuous Integration (Optional)

### GitHub Actions for Automated Publishing

Create `.github/workflows/publish.yml`:

```yaml
name: Publish Package

on:
  release:
    types: [created]

jobs:
  publish:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
          registry-url: 'https://registry.npmjs.org'
      
      - run: npm ci
      - run: npm test
      - run: npm run build
      
      - run: npm publish
        env:
          NODE_AUTH_TOKEN: ${{secrets.NPM_TOKEN}}
```

Then:
1. Go to npmjs.com → Account Settings → Access Tokens
2. Create a new token
3. Add it to GitHub repository secrets as `NPM_TOKEN`

## Post-Publishing

### 1. Verify the Package

```bash
npm view edgecraft
```

### 2. Test Installation

In a new project:

```bash
npm install edgecraft
```

### 3. Create a Git Tag

```bash
git tag v0.1.0
git push origin v0.1.0
```

## Version Management

Follow [Semantic Versioning](https://semver.org/):

- **PATCH** (0.1.1): Bug fixes
- **MINOR** (0.2.0): New features (backward compatible)
- **MAJOR** (1.0.0): Breaking changes

## Common Issues

### "Package name taken"

Use a scoped package: `@yourusername/edgecraft`

### "You do not have permission to publish"

Run `npm login` again or check your npm account.

### "Missing dependencies"

Make sure `package.json` has all required dependencies listed.

### Files not included in package

Check `.npmignore` - it controls what files are excluded.
Only these are included by default:
- `dist/`
- `README.md`
- `LICENSE`
- `package.json`

## Best Practices

1. **Always build before publishing**: Run `npm run build`
2. **Test the package**: Use `npm pack` to verify contents
3. **Update changelog**: Document what changed
4. **Tag releases**: Use git tags for versions
5. **Write good docs**: Keep README.md updated
6. **Use semantic versioning**: Follow semver rules
7. **Test in real projects**: Before major releases

## Checklist Before Publishing

- [ ] All tests pass: `npm test`
- [ ] Build succeeds: `npm run build`
- [ ] README.md is updated
- [ ] Version number is correct in package.json
- [ ] CHANGELOG.md is updated (if you have one)
- [ ] Examples work with the new version
- [ ] No sensitive data in the package
- [ ] License is correct
- [ ] Git commits are pushed

## Getting Started After Publishing

Share your package:

```bash
# Install it in a project
npm install edgecraft

# Use it
import { EdgeCraft } from 'edgecraft';

const graph = new EdgeCraft({
  container: '#graph',
  data: myGraphData
});
```

## Support

- npm documentation: https://docs.npmjs.com/
- npm support: https://www.npmjs.com/support
- Semantic Versioning: https://semver.org/

---

Good luck with your package! 🚀
