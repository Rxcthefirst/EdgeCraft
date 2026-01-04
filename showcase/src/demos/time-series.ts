/**
 * Time Series Demo
 * Demonstrates temporal graph visualization with animation
 */
import { EdgeCraft, TimeSeriesManager } from 'edgecraft';

export default async function() {
  const container = document.getElementById('graph-container');
  if (!container) return;

  // Create UI controls container - fixed to viewport bottom
  const controlsContainer = document.createElement('div');
  controlsContainer.id = 'time-series-controls';
  controlsContainer.style.cssText = `
    position: fixed;
    bottom: 20px;
    left: 50%;
    transform: translateX(-50%);
    background: white;
    padding: 20px;
    border-radius: 8px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.2);
    z-index: 10000;
    min-width: 600px;
  `;
  document.body.appendChild(controlsContainer);

  // Initial graph configuration
  const graph = new EdgeCraft({
    container,
    data: { nodes: [], edges: [] },
    renderer: {
      type: 'canvas'
    },
    layout: {
      type: 'force',
      iterations: 300
    },
    nodeStyle: {
      radius: 25,
      fill: (node: any) => {
        if (node.properties?.type === 'company') return '#3b82f6';
        if (node.properties?.type === 'product') return '#10b981';
        if (node.properties?.type === 'person') return '#f59e0b';
        return '#94a3b8';
      },
      stroke: '#ffffff',
      strokeWidth: 2,
      label: {
        visible: true,
        position: 'bottom',
        fontSize: 11,
        color: '#1f2937'
      }
    },
    edgeStyle: {
      stroke: (edge: any) => {
        if (edge.properties?.type === 'founded') return '#3b82f6';
        if (edge.properties?.type === 'launched') return '#10b981';
        if (edge.properties?.type === 'hired') return '#f59e0b';
        if (edge.properties?.type === 'acquired') return '#ef4444';
        return '#94a3b8';
      },
      strokeWidth: 2,
      label: {
        visible: true,
        fontSize: 10,
        color: '#64748b'
      }
    }
  });

  // Create time series manager
  const timeSeries = new TimeSeriesManager({
    speed: 1.0,
    loop: true,
    interpolate: true
  });

  // Connect time series to graph
  timeSeries.onGraphUpdate((data) => {
    graph.setData(data);
  });

  // Define snapshots - company growth over time
  const snapshots = [
    // Year 2020 - Company founded
    {
      timestamp: 0,
      label: '2020 - Founded',
      nodes: [
        { id: 'founder1', label: 'Alice Chen', properties: { type: 'person' } },
        { id: 'founder2', label: 'Bob Smith', properties: { type: 'person' } },
      ],
      edges: []
    },
    
    // Early 2020 - Company incorporation
    {
      timestamp: 2000,
      label: '2020 Q2 - Company Inc',
      nodes: [
        { id: 'founder1', label: 'Alice Chen', properties: { type: 'person' } },
        { id: 'founder2', label: 'Bob Smith', properties: { type: 'person' } },
        { id: 'company', label: 'TechStart Inc', properties: { type: 'company' } },
      ],
      edges: [
        { id: 'e1', source: 'founder1', target: 'company', label: 'Founded', properties: { type: 'founded' } },
        { id: 'e2', source: 'founder2', target: 'company', label: 'Co-Founded', properties: { type: 'founded' } },
      ]
    },
    
    // Mid 2020 - First product
    {
      timestamp: 4000,
      label: '2020 Q4 - Product Launch',
      nodes: [
        { id: 'founder1', label: 'Alice Chen', properties: { type: 'person' } },
        { id: 'founder2', label: 'Bob Smith', properties: { type: 'person' } },
        { id: 'company', label: 'TechStart Inc', properties: { type: 'company' } },
        { id: 'product1', label: 'App v1.0', properties: { type: 'product' } },
      ],
      edges: [
        { id: 'e1', source: 'founder1', target: 'company', label: 'Founded', properties: { type: 'founded' } },
        { id: 'e2', source: 'founder2', target: 'company', label: 'Co-Founded', properties: { type: 'founded' } },
        { id: 'e3', source: 'company', target: 'product1', label: 'Launched', properties: { type: 'launched' } },
      ]
    },
    
    // Year 2021 - Team growth
    {
      timestamp: 6000,
      label: '2021 Q2 - Team Expansion',
      nodes: [
        { id: 'founder1', label: 'Alice Chen', properties: { type: 'person' } },
        { id: 'founder2', label: 'Bob Smith', properties: { type: 'person' } },
        { id: 'company', label: 'TechStart Inc', properties: { type: 'company' } },
        { id: 'product1', label: 'App v1.0', properties: { type: 'product' } },
        { id: 'emp1', label: 'Carol Davis', properties: { type: 'person' } },
        { id: 'emp2', label: 'David Lee', properties: { type: 'person' } },
        { id: 'emp3', label: 'Eva Martinez', properties: { type: 'person' } },
      ],
      edges: [
        { id: 'e1', source: 'founder1', target: 'company', label: 'Founded', properties: { type: 'founded' } },
        { id: 'e2', source: 'founder2', target: 'company', label: 'Co-Founded', properties: { type: 'founded' } },
        { id: 'e3', source: 'company', target: 'product1', label: 'Launched', properties: { type: 'launched' } },
        { id: 'e4', source: 'company', target: 'emp1', label: 'Hired', properties: { type: 'hired' } },
        { id: 'e5', source: 'company', target: 'emp2', label: 'Hired', properties: { type: 'hired' } },
        { id: 'e6', source: 'company', target: 'emp3', label: 'Hired', properties: { type: 'hired' } },
      ]
    },
    
    // Late 2021 - Second product
    {
      timestamp: 8000,
      label: '2021 Q4 - New Product',
      nodes: [
        { id: 'founder1', label: 'Alice Chen', properties: { type: 'person' } },
        { id: 'founder2', label: 'Bob Smith', properties: { type: 'person' } },
        { id: 'company', label: 'TechStart Inc', properties: { type: 'company' } },
        { id: 'product1', label: 'App v1.0', properties: { type: 'product' } },
        { id: 'product2', label: 'App v2.0', properties: { type: 'product' } },
        { id: 'emp1', label: 'Carol Davis', properties: { type: 'person' } },
        { id: 'emp2', label: 'David Lee', properties: { type: 'person' } },
        { id: 'emp3', label: 'Eva Martinez', properties: { type: 'person' } },
      ],
      edges: [
        { id: 'e1', source: 'founder1', target: 'company', label: 'Founded', properties: { type: 'founded' } },
        { id: 'e2', source: 'founder2', target: 'company', label: 'Co-Founded', properties: { type: 'founded' } },
        { id: 'e3', source: 'company', target: 'product1', label: 'Launched', properties: { type: 'launched' } },
        { id: 'e4', source: 'company', target: 'emp1', label: 'Hired', properties: { type: 'hired' } },
        { id: 'e5', source: 'company', target: 'emp2', label: 'Hired', properties: { type: 'hired' } },
        { id: 'e6', source: 'company', target: 'emp3', label: 'Hired', properties: { type: 'hired' } },
        { id: 'e7', source: 'company', target: 'product2', label: 'Launched', properties: { type: 'launched' } },
      ]
    },
    
    // Year 2022 - More growth
    {
      timestamp: 10000,
      label: '2022 Q2 - Partnership',
      nodes: [
        { id: 'founder1', label: 'Alice Chen', properties: { type: 'person' } },
        { id: 'founder2', label: 'Bob Smith', properties: { type: 'person' } },
        { id: 'company', label: 'TechStart Inc', properties: { type: 'company' } },
        { id: 'product1', label: 'App v1.0', properties: { type: 'product' } },
        { id: 'product2', label: 'App v2.0', properties: { type: 'product' } },
        { id: 'emp1', label: 'Carol Davis', properties: { type: 'person' } },
        { id: 'emp2', label: 'David Lee', properties: { type: 'person' } },
        { id: 'emp3', label: 'Eva Martinez', properties: { type: 'person' } },
        { id: 'partner', label: 'BigCorp', properties: { type: 'company' } },
      ],
      edges: [
        { id: 'e1', source: 'founder1', target: 'company', label: 'Founded', properties: { type: 'founded' } },
        { id: 'e2', source: 'founder2', target: 'company', label: 'Co-Founded', properties: { type: 'founded' } },
        { id: 'e3', source: 'company', target: 'product1', label: 'Launched', properties: { type: 'launched' } },
        { id: 'e4', source: 'company', target: 'emp1', label: 'Hired', properties: { type: 'hired' } },
        { id: 'e5', source: 'company', target: 'emp2', label: 'Hired', properties: { type: 'hired' } },
        { id: 'e6', source: 'company', target: 'emp3', label: 'Hired', properties: { type: 'hired' } },
        { id: 'e7', source: 'company', target: 'product2', label: 'Launched', properties: { type: 'launched' } },
        { id: 'e8', source: 'partner', target: 'company', label: 'Partnered', properties: { type: 'acquired' } },
      ]
    },
    
    // Year 2023 - Acquisition
    {
      timestamp: 12000,
      label: '2023 - Acquired!',
      nodes: [
        { id: 'founder1', label: 'Alice Chen', properties: { type: 'person' } },
        { id: 'founder2', label: 'Bob Smith', properties: { type: 'person' } },
        { id: 'company', label: 'TechStart Inc', properties: { type: 'company' } },
        { id: 'product1', label: 'App v1.0', properties: { type: 'product' } },
        { id: 'product2', label: 'App v2.0', properties: { type: 'product' } },
        { id: 'emp1', label: 'Carol Davis', properties: { type: 'person' } },
        { id: 'emp2', label: 'David Lee', properties: { type: 'person' } },
        { id: 'emp3', label: 'Eva Martinez', properties: { type: 'person' } },
        { id: 'partner', label: 'BigCorp', properties: { type: 'company' } },
      ],
      edges: [
        { id: 'e1', source: 'founder1', target: 'company', label: 'Founded', properties: { type: 'founded' } },
        { id: 'e2', source: 'founder2', target: 'company', label: 'Co-Founded', properties: { type: 'founded' } },
        { id: 'e3', source: 'company', target: 'product1', label: 'Launched', properties: { type: 'launched' } },
        { id: 'e4', source: 'company', target: 'emp1', label: 'Hired', properties: { type: 'hired' } },
        { id: 'e5', source: 'company', target: 'emp2', label: 'Hired', properties: { type: 'hired' } },
        { id: 'e6', source: 'company', target: 'emp3', label: 'Hired', properties: { type: 'hired' } },
        { id: 'e7', source: 'company', target: 'product2', label: 'Launched', properties: { type: 'launched' } },
        { id: 'e9', source: 'partner', target: 'company', label: 'Acquired', properties: { type: 'acquired' } },
      ]
    }
  ];

  // Add all snapshots
  timeSeries.addSnapshots(snapshots);

  // Build controls UI
  let currentLabel = '';
  
  const html = `
    <div style="margin-bottom: 12px;">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
        <h3 style="margin: 0; font-size: 16px; color: #1f2937;">Company Growth Timeline</h3>
        <div id="time-label" style="font-size: 14px; font-weight: 600; color: #3b82f6;">2020 - Founded</div>
      </div>
      
      <div style="display: flex; gap: 10px; align-items: center; margin-bottom: 10px;">
        <button id="btn-start" title="Go to start" style="padding: 6px 12px; cursor: pointer; border: 1px solid #d1d5db; border-radius: 4px; background: white;">⏮️</button>
        <button id="btn-prev" title="Previous" style="padding: 6px 12px; cursor: pointer; border: 1px solid #d1d5db; border-radius: 4px; background: white;">⏪</button>
        <button id="btn-play" title="Play/Pause" style="padding: 6px 16px; cursor: pointer; border: 1px solid #3b82f6; border-radius: 4px; background: #3b82f6; color: white; font-weight: 600;">▶️ Play</button>
        <button id="btn-next" title="Next" style="padding: 6px 12px; cursor: pointer; border: 1px solid #d1d5db; border-radius: 4px; background: white;">⏩</button>
        <button id="btn-end" title="Go to end" style="padding: 6px 12px; cursor: pointer; border: 1px solid #d1d5db; border-radius: 4px; background: white;">⏭️</button>
        
        <div style="flex: 1; margin: 0 10px;">
          <input type="range" id="time-slider" min="0" max="12000" value="0" step="100" style="width: 100%;">
        </div>
        
        <div style="display: flex; gap: 10px; align-items: center;">
          <label style="font-size: 12px; color: #64748b;">Speed:</label>
          <select id="speed-select" style="padding: 4px 8px; border: 1px solid #d1d5db; border-radius: 4px;">
            <option value="0.5">0.5x</option>
            <option value="1" selected>1x</option>
            <option value="2">2x</option>
            <option value="4">4x</option>
          </select>
          
          <label style="font-size: 12px; color: #64748b; margin-left: 10px;">
            <input type="checkbox" id="loop-checkbox" checked>
            Loop
          </label>
          
          <label style="font-size: 12px; color: #64748b; margin-left: 10px;">
            <input type="checkbox" id="interpolate-checkbox" checked>
            Interpolate
          </label>
        </div>
      </div>
    </div>
    
    <div style="border-top: 1px solid #e5e7eb; padding-top: 12px;">
      <h4 style="margin: 0 0 8px 0; font-size: 13px; color: #64748b;">Legend</h4>
      <div style="display: flex; gap: 20px; font-size: 12px;">
        <div style="display: flex; align-items: center; gap: 6px;">
          <div style="width: 16px; height: 16px; background: #3b82f6; border-radius: 50%;"></div>
          <span>Company</span>
        </div>
        <div style="display: flex; align-items: center; gap: 6px;">
          <div style="width: 16px; height: 16px; background: #10b981; border-radius: 50%;"></div>
          <span>Product</span>
        </div>
        <div style="display: flex; align-items: center; gap: 6px;">
          <div style="width: 16px; height: 16px; background: #f59e0b; border-radius: 50%;"></div>
          <span>Person</span>
        </div>
      </div>
    </div>
  `;

  controlsContainer.innerHTML = html;

  // Get control elements
  const btnPlay = document.getElementById('btn-play') as HTMLButtonElement;
  const btnStart = document.getElementById('btn-start') as HTMLButtonElement;
  const btnEnd = document.getElementById('btn-end') as HTMLButtonElement;
  const btnPrev = document.getElementById('btn-prev') as HTMLButtonElement;
  const btnNext = document.getElementById('btn-next') as HTMLButtonElement;
  const timeSlider = document.getElementById('time-slider') as HTMLInputElement;
  const timeLabel = document.getElementById('time-label') as HTMLDivElement;
  const speedSelect = document.getElementById('speed-select') as HTMLSelectElement;
  const loopCheckbox = document.getElementById('loop-checkbox') as HTMLInputElement;
  const interpolateCheckbox = document.getElementById('interpolate-checkbox') as HTMLInputElement;

  // Update UI based on time series state
  timeSeries.onChange((state) => {
    if (btnPlay) {
      btnPlay.textContent = state.isPlaying ? '⏸️ Pause' : '▶️ Play';
    }
    
    if (timeSlider) {
      timeSlider.value = state.currentTime.toString();
    }
    
    // Update label
    const snapshot = snapshots.find(s => s.timestamp <= state.currentTime);
    if (snapshot && snapshot.label !== currentLabel) {
      currentLabel = snapshot.label;
      if (timeLabel) {
        timeLabel.textContent = currentLabel;
      }
    }
  });

  // Wire up controls
  btnPlay?.addEventListener('click', () => timeSeries.togglePlayPause());
  btnStart?.addEventListener('click', () => timeSeries.goToStart());
  btnEnd?.addEventListener('click', () => timeSeries.goToEnd());
  btnPrev?.addEventListener('click', () => timeSeries.previous());
  btnNext?.addEventListener('click', () => timeSeries.next());
  
  timeSlider?.addEventListener('input', (e) => {
    const value = parseInt((e.target as HTMLInputElement).value);
    timeSeries.seekTo(value);
  });
  
  speedSelect?.addEventListener('change', (e) => {
    const speed = parseFloat((e.target as HTMLSelectElement).value);
    timeSeries.setSpeed(speed);
  });
  
  loopCheckbox?.addEventListener('change', (e) => {
    timeSeries.setLoop((e.target as HTMLInputElement).checked);
  });
  
  interpolateCheckbox?.addEventListener('change', (e) => {
    timeSeries.setInterpolation((e.target as HTMLInputElement).checked);
  });

  // Initialize first snapshot
  timeSeries.goToStart();

  // Add description
  const description = document.createElement('div');
  description.style.cssText = `
    position: absolute;
    top: 20px;
    right: 20px;
    background: white;
    padding: 16px;
    border-radius: 8px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.2);
    max-width: 300px;
    font-size: 13px;
    line-height: 1.6;
  `;
  description.innerHTML = `
    <h3 style="margin: 0 0 10px 0; font-size: 15px; color: #1f2937;">Time Series Demo</h3>
    <p style="margin: 0 0 10px 0; color: #64748b;">
      This demo shows how a graph can evolve over time. Watch as the company grows from
      founding to acquisition, with new team members, products, and partnerships appearing
      along the timeline.
    </p>
    <p style="margin: 0; color: #64748b;">
      <strong>Features:</strong>
    </p>
    <ul style="margin: 8px 0 0 0; padding-left: 20px; color: #64748b;">
      <li>Timeline animation</li>
      <li>Snapshot management</li>
      <li>Playback controls</li>
      <li>Speed adjustment</li>
      <li>Smooth interpolation</li>
      <li>Loop mode</li>
    </ul>
  `;
  container.appendChild(description);

  // Cleanup function - remove controls when leaving demo
  const cleanup = () => {
    const controls = document.getElementById('time-series-controls');
    if (controls) {
      controls.remove();
    }
    timeSeries.destroy();
  };

  // Store cleanup function for page navigation
  (window as any).__timeSeriesCleanup = cleanup;
  
  // Also cleanup on beforeunload
  window.addEventListener('beforeunload', cleanup, { once: true });
}
