# Contributing to EdgeCraft

Thank you for your interest in contributing to EdgeCraft! This document provides guidelines and instructions for contributing.

## Development Setup

1. **Clone the repository**

```bash
git clone https://github.com/yourusername/edgecraft.git
cd edgecraft
```

2. **Install dependencies**

```bash
npm install
```

3. **Build the project**

```bash
npm run build
```

4. **Run in development mode**

```bash
npm run dev
```

This will watch for changes and rebuild automatically.

## Project Structure

```
edgecraft/
├── src/
│   ├── core/           # Core graph data structures
│   ├── layout/         # Layout algorithms
│   ├── renderer/       # Rendering engine
│   ├── interaction/    # User interaction handling
│   ├── types.ts        # TypeScript type definitions
│   ├── EdgeCraft.ts    # Main API class
│   └── index.ts        # Package entry point
├── examples/           # Example HTML files
├── dist/              # Built output (generated)
└── tests/             # Test files (to be added)
```

## Development Workflow

### Making Changes

1. Create a new branch:
```bash
git checkout -b feature/your-feature-name
```

2. Make your changes

3. Test your changes:
```bash
npm run build
# Open examples/basic.html in a browser
```

4. Commit your changes:
```bash
git add .
git commit -m "feat: add your feature description"
```

### Commit Message Convention

We follow [Conventional Commits](https://www.conventionalcommits.org/):

- `feat:` - New feature
- `fix:` - Bug fix
- `docs:` - Documentation changes
- `style:` - Code style changes (formatting, etc.)
- `refactor:` - Code refactoring
- `test:` - Adding tests
- `chore:` - Maintenance tasks

Examples:
```
feat: add radial layout algorithm
fix: correct edge rendering for self-loops
docs: update API reference for node styling
refactor: optimize force-directed layout performance
```

## Code Style

- Use TypeScript for all new code
- Follow the existing code style
- Run `npm run lint` to check for linting errors
- Run `npm run format` to format code with Prettier

## Testing

Currently, the project uses manual testing with the examples. We welcome contributions to add automated tests!

To test your changes:
1. Build the project: `npm run build`
2. Open `examples/basic.html` or `examples/rdf.html` in a browser
3. Verify functionality works as expected

## Adding New Features

### Adding a New Layout Algorithm

1. Create a new layout class in `src/layout/LayoutEngine.ts`:

```typescript
export class MyNewLayout implements LayoutEngine {
  compute(graph: Graph, config: LayoutConfig): Map<string | number, Position> {
    // Your layout algorithm here
  }
}
```

2. Register it in `getLayoutEngine()`:

```typescript
export function getLayoutEngine(type: string): LayoutEngine {
  switch (type) {
    // ... existing cases
    case 'mynew':
      return new MyNewLayout();
    default:
      return new ForceDirectedLayout();
  }
}
```

3. Update type definitions in `types.ts`:

```typescript
export interface LayoutConfig {
  type: 'force' | 'hierarchical' | 'circular' | 'grid' | 'mynew';
  // ...
}
```

### Adding New Node Shapes

1. Add the shape to `createNodeShape()` in `src/renderer/Renderer.ts`

2. Update the type definition:

```typescript
export interface NodeStyle {
  shape?: 'circle' | 'rectangle' | 'diamond' | 'hexagon' | 'myshape';
  // ...
}
```

## Documentation

When adding new features:

1. Update `README.md` with usage examples
2. Add JSDoc comments to public APIs
3. Create or update examples in `examples/`
4. Update `CHANGELOG.md`

## Pull Request Process

1. **Update documentation** if needed
2. **Test your changes** thoroughly
3. **Update CHANGELOG.md** with your changes
4. **Push your branch** and create a pull request
5. **Describe your changes** in the PR description
6. Wait for review and address feedback

### PR Checklist

- [ ] Code builds successfully (`npm run build`)
- [ ] Examples work with your changes
- [ ] Documentation is updated
- [ ] CHANGELOG.md is updated
- [ ] Code follows project style
- [ ] Commit messages follow convention

## Feature Requests and Bug Reports

### Reporting Bugs

Use GitHub Issues with the "bug" label:

**Title:** Brief description of the bug

**Description should include:**
- Steps to reproduce
- Expected behavior
- Actual behavior
- Browser/environment details
- Code sample (if applicable)

### Requesting Features

Use GitHub Issues with the "enhancement" label:

**Title:** Brief description of the feature

**Description should include:**
- Use case / motivation
- Proposed API (if applicable)
- Example usage
- Alternatives considered

## Community

- Be respectful and inclusive
- Help others when you can
- Give constructive feedback
- Follow the [Code of Conduct](CODE_OF_CONDUCT.md)

## Questions?

- Open a GitHub issue with the "question" label
- Check existing documentation and issues first

## License

By contributing, you agree that your contributions will be licensed under the MIT License.

Thank you for contributing to EdgeCraft! 🎨
