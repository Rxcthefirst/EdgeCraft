# EdgeCraft Showcase

Interactive demonstrations and documentation for EdgeCraft graph visualization library.

## Features

- **Landing Page**: Product overview with hero section, features, and use cases
- **Demo Gallery**: Organized collection of interactive examples
- **Individual Demo Pages**: 
  - Left panel: Live graph visualization
  - Right panel: Tabbed interface with Info, Code, Settings, and Data
- **Documentation**: Complete API reference and guides
- **Responsive Design**: Works on desktop and mobile

## Project Structure

```
showcase/
├── src/
│   ├── main.ts              # Entry point
│   ├── router.ts            # Client-side routing
│   ├── pages/
│   │   ├── home.ts          # Landing page
│   │   ├── demo-list.ts     # Demo gallery
│   │   ├── demo.ts          # Individual demo page
│   │   └── docs.ts          # Documentation
│   └── demos/
│       ├── template.ts      # Demo template
│       ├── force-directed.ts
│       ├── hierarchical.ts
│       └── ... (more demos)
├── styles/
│   └── main.css             # Main stylesheet
├── public/                  # Static assets
├── index.html               # HTML template
├── package.json
└── vite.config.js           # Vite configuration
```

## Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

The dev server runs at `http://localhost:3000`

## Adding New Demos

1. Create a new file in `src/demos/your-demo.ts`
2. Implement the demo following the template pattern:

```typescript
export default async function() {
  const container = document.getElementById('graph-container');
  // Initialize your graph here
  
  // Update UI elements
  // - Feature list: #feature-list
  // - Stats: #stat-nodes, #stat-edges, #stat-fps, #stat-render
  // - Code example: #code-example
  // - Config controls: #config-controls
}
```

3. Add the demo to the list in `src/pages/demo-list.ts`:

```typescript
{
  id: 'your-demo',
  title: 'Your Demo Title',
  description: 'Brief description',
  category: 'Layouts' // or 'Advanced', 'Performance', 'Use Cases'
}
```

## Routes

- `/` - Landing page
- `/demos` - Demo gallery
- `/demo/:id` - Individual demo page
- `/docs` - Documentation

## Tech Stack

- **Vite**: Fast build tool and dev server
- **TypeScript**: Type-safe development
- **Vanilla JS**: No framework dependencies
- **CSS3**: Modern styling with CSS variables
- **EdgeCraft**: The star of the show!

## Design Inspiration

The showcase is inspired by [Keylines](https://keylines.cambridge-intelligence.com/), featuring:
- Clean, professional design
- Split-panel demo layout
- Tabbed interface for multiple views
- Responsive navigation
- Dark code blocks
- Smooth transitions

## Deployment

Build the project and deploy the `dist` folder to any static hosting:

```bash
npm run build
# Deploy dist/ to Netlify, Vercel, GitHub Pages, etc.
```

## License

MIT
