/**
 * Animated Adaptive Layout Demo
 * Demonstrates smooth layout animations and adaptive positioning
 * that preserves existing node positions while incorporating new nodes
 */
import { EdgeCraft, TimeSeriesManager, LayoutAnimator, AdaptiveLayout } from 'edgecraft';

export default async function() {
  const container = document.getElementById('graph-container');
  if (!container) return;

  let currentGraph: EdgeCraft | null = null;
  const layoutAnimator = new LayoutAnimator();
  const adaptiveLayout = new AdaptiveLayout({
    existingNodeMobility: 0.15,  // Existing nodes move only 15%
    newNodeSpacing: 120,
    settleIterations: 60,
    forceStrength: 0.4
  });

  // Track which nodes exist at each step
  let existingNodeIds = new Set<string>();
  let previousPositions = new Map<string | number, { x: number; y: number }>();

  // Initial graph state
  const initialData = {
    nodes: [
      { id: 'ceo', label: 'CEO', properties: { role: 'executive', level: 0 } },
      { id: 'cto', label: 'CTO', properties: { role: 'executive', level: 1 } },
      { id: 'cfo', label: 'CFO', properties: { role: 'executive', level: 1 } },
    ],
    edges: [
      { id: 'e1', source: 'ceo', target: 'cto', label: 'Reports to' },
      { id: 'e2', source: 'ceo', target: 'cfo', label: 'Reports to' },
    ]
  };

  // Function to update graph with animation
  const updateGraphAnimated = async (newData: any) => {
    if (!currentGraph) return;

    // Step 1: Capture current positions from EdgeCraft's position map
    const oldPositions = new Map<string | number, { x: number; y: number }>();
    const currentPositions = (currentGraph as any).positions;
    if (currentPositions) {
      currentPositions.forEach((pos: any, id: string | number) => {
        oldPositions.set(id, { x: pos.x, y: pos.y });
      });
    }
    
    // Step 2: Update graph data (this will compute layout and render)
    currentGraph.setData(newData);
    
    // Step 3: Capture the newly computed positions
    const newPositions = new Map<string | number, { x: number; y: number }>();
    const updatedPositions = (currentGraph as any).positions;
    if (updatedPositions) {
      updatedPositions.forEach((pos: any, id: string | number) => {
        newPositions.set(id, { x: pos.x, y: pos.y });
      });
    }
    
    // Step 4: Reset positions to old values (for nodes that existed)
    // and prepare for animation
    if (updatedPositions) {
      updatedPositions.forEach((pos: any, id: string | number) => {
        const oldPos = oldPositions.get(id);
        if (oldPos) {
          // Existing node - reset to old position
          pos.x = oldPos.x;
          pos.y = oldPos.y;
        }
        // New nodes stay at their computed position (will fade in)
      });
    }
    
    // Step 5: Render with old positions (no visible jump)
    currentGraph.render();
    
    // Step 6: Create animation transitions
    const transitions: any[] = [];
    newPositions.forEach((newPos, id) => {
      const oldPos = oldPositions.get(id);
      transitions.push({
        id: id,
        fromX: oldPos ? oldPos.x : newPos.x,
        fromY: oldPos ? oldPos.y : newPos.y,
        toX: newPos.x,
        toY: newPos.y
      });
    });
    
    // Step 7: Animate to new positions
    if (transitions.length > 0) {
      const animPositions = new Map<string | number, { x: number; y: number }>();
      
      // Initialize animation positions
      transitions.forEach(t => {
        animPositions.set(t.id, { x: t.fromX, y: t.fromY });
      });
      
      await layoutAnimator.animate(transitions, animPositions, {
        duration: 1200,
        easing: 'easeInOutCubic',
        onFrame: () => {
          // Update EdgeCraft's position map with interpolated values
          if (updatedPositions) {
            animPositions.forEach((animPos, id) => {
              const pos = updatedPositions.get(id);
              if (pos) {
                pos.x = animPos.x;
                pos.y = animPos.y;
              }
            });
          }
          currentGraph!.render();
        },
        onComplete: () => {
          // Final render with exact target positions
          if (updatedPositions) {
            newPositions.forEach((newPos, id) => {
              const pos = updatedPositions.get(id);
              if (pos) {
                pos.x = newPos.x;
                pos.y = newPos.y;
              }
            });
          }
          currentGraph!.render();
        }
      });
    }
    
    // Update tracking
    existingNodeIds = new Set(newData.nodes.map((n: any) => n.id));
    previousPositions = newPositions;
  };

  // Initialize graph
  currentGraph = new EdgeCraft({
    container,
    data: initialData,
    renderer: {
      type: 'canvas'
    },
    layout: {
      type: 'force',
      iterations: 200
    },
    nodeStyle: {
      radius: 30,
      fill: (node: any) => {
        if (node.properties?.role === 'executive') return '#ef4444';
        if (node.properties?.role === 'manager') return '#f59e0b';
        if (node.properties?.role === 'engineer') return '#3b82f6';
        if (node.properties?.role === 'designer') return '#8b5cf6';
        return '#94a3b8';
      },
      stroke: '#ffffff',
      strokeWidth: 3,
      label: {
        visible: true,
        position: 'bottom',
        fontSize: 12,
        color: '#1f2937',
        fontWeight: 'bold'
      }
    },
    edgeStyle: {
      stroke: '#94a3b8',
      strokeWidth: 2
    }
  });

  // Initialize tracking
  existingNodeIds = new Set(initialData.nodes.map(n => n.id));

  // Store initial positions after layout completes
  setTimeout(() => {
    const positions = (currentGraph as any).positions;
    if (positions) {
      positions.forEach((pos: any, id: string | number) => {
        previousPositions.set(id, { x: pos.x, y: pos.y });
      });
    }
  }, 500);

  // Define growth stages
  const stages = [
    {
      label: 'Initial - Executive Team',
      data: initialData
    },
    {
      label: 'Stage 1 - Add Engineering Manager',
      data: {
        nodes: [
          ...initialData.nodes,
          { id: 'eng-mgr', label: 'Engineering\nManager', properties: { role: 'manager', level: 2 } },
        ],
        edges: [
          ...initialData.edges,
          { id: 'e3', source: 'cto', target: 'eng-mgr', label: 'Manages' },
        ]
      }
    },
    {
      label: 'Stage 2 - Add Engineers',
      data: {
        nodes: [
          ...initialData.nodes,
          { id: 'eng-mgr', label: 'Engineering\nManager', properties: { role: 'manager', level: 2 } },
          { id: 'eng1', label: 'Engineer 1', properties: { role: 'engineer', level: 3 } },
          { id: 'eng2', label: 'Engineer 2', properties: { role: 'engineer', level: 3 } },
          { id: 'eng3', label: 'Engineer 3', properties: { role: 'engineer', level: 3 } },
        ],
        edges: [
          ...initialData.edges,
          { id: 'e3', source: 'cto', target: 'eng-mgr', label: 'Manages' },
          { id: 'e4', source: 'eng-mgr', target: 'eng1', label: 'Manages' },
          { id: 'e5', source: 'eng-mgr', target: 'eng2', label: 'Manages' },
          { id: 'e6', source: 'eng-mgr', target: 'eng3', label: 'Manages' },
        ]
      }
    },
    {
      label: 'Stage 3 - Add Design Team',
      data: {
        nodes: [
          ...initialData.nodes,
          { id: 'eng-mgr', label: 'Engineering\nManager', properties: { role: 'manager', level: 2 } },
          { id: 'eng1', label: 'Engineer 1', properties: { role: 'engineer', level: 3 } },
          { id: 'eng2', label: 'Engineer 2', properties: { role: 'engineer', level: 3 } },
          { id: 'eng3', label: 'Engineer 3', properties: { role: 'engineer', level: 3 } },
          { id: 'design-mgr', label: 'Design\nManager', properties: { role: 'manager', level: 2 } },
          { id: 'designer1', label: 'Designer 1', properties: { role: 'designer', level: 3 } },
          { id: 'designer2', label: 'Designer 2', properties: { role: 'designer', level: 3 } },
        ],
        edges: [
          ...initialData.edges,
          { id: 'e3', source: 'cto', target: 'eng-mgr', label: 'Manages' },
          { id: 'e4', source: 'eng-mgr', target: 'eng1', label: 'Manages' },
          { id: 'e5', source: 'eng-mgr', target: 'eng2', label: 'Manages' },
          { id: 'e6', source: 'eng-mgr', target: 'eng3', label: 'Manages' },
          { id: 'e7', source: 'cto', target: 'design-mgr', label: 'Manages' },
          { id: 'e8', source: 'design-mgr', target: 'designer1', label: 'Manages' },
          { id: 'e9', source: 'design-mgr', target: 'designer2', label: 'Manages' },
        ]
      }
    },
    {
      label: 'Stage 4 - Add Finance Team',
      data: {
        nodes: [
          ...initialData.nodes,
          { id: 'eng-mgr', label: 'Engineering\nManager', properties: { role: 'manager', level: 2 } },
          { id: 'eng1', label: 'Engineer 1', properties: { role: 'engineer', level: 3 } },
          { id: 'eng2', label: 'Engineer 2', properties: { role: 'engineer', level: 3 } },
          { id: 'eng3', label: 'Engineer 3', properties: { role: 'engineer', level: 3 } },
          { id: 'design-mgr', label: 'Design\nManager', properties: { role: 'manager', level: 2 } },
          { id: 'designer1', label: 'Designer 1', properties: { role: 'designer', level: 3 } },
          { id: 'designer2', label: 'Designer 2', properties: { role: 'designer', level: 3 } },
          { id: 'accountant', label: 'Accountant', properties: { role: 'manager', level: 2 } },
        ],
        edges: [
          ...initialData.edges,
          { id: 'e3', source: 'cto', target: 'eng-mgr', label: 'Manages' },
          { id: 'e4', source: 'eng-mgr', target: 'eng1', label: 'Manages' },
          { id: 'e5', source: 'eng-mgr', target: 'eng2', label: 'Manages' },
          { id: 'e6', source: 'eng-mgr', target: 'eng3', label: 'Manages' },
          { id: 'e7', source: 'cto', target: 'design-mgr', label: 'Manages' },
          { id: 'e8', source: 'design-mgr', target: 'designer1', label: 'Manages' },
          { id: 'e9', source: 'design-mgr', target: 'designer2', label: 'Manages' },
          { id: 'e10', source: 'cfo', target: 'accountant', label: 'Manages' },
        ]
      }
    }
  ];

  let currentStage = 0;

  // Create controls
  const controlsContainer = document.createElement('div');
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
    min-width: 500px;
  `;

  const html = `
    <div style="margin-bottom: 12px;">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
        <h3 style="margin: 0; font-size: 16px; color: #1f2937;">Animated Adaptive Layout</h3>
        <div id="stage-label" style="font-size: 14px; font-weight: 600; color: #3b82f6;">Initial - Executive Team</div>
      </div>
      
      <div style="display: flex; gap: 10px; align-items: center; margin-bottom: 10px;">
        <button id="btn-prev" style="padding: 8px 16px; cursor: pointer; border: 1px solid #d1d5db; border-radius: 4px; background: white; font-weight: 600;">← Previous</button>
        <button id="btn-next" style="padding: 8px 16px; cursor: pointer; border: 1px solid #3b82f6; border-radius: 4px; background: #3b82f6; color: white; font-weight: 600;">Next Stage →</button>
        <button id="btn-auto" style="padding: 8px 16px; cursor: pointer; border: 1px solid #10b981; border-radius: 4px; background: #10b981; color: white; font-weight: 600;">▶ Auto Play</button>
        <button id="btn-reset" style="padding: 8px 16px; cursor: pointer; border: 1px solid #d1d5db; border-radius: 4px; background: white;">Reset</button>
        
        <div style="flex: 1; text-align: right; font-size: 13px; color: #64748b;">
          Stage <span id="stage-num">1</span> of ${stages.length}
        </div>
      </div>
    </div>
    
    <div style="border-top: 1px solid #e5e7eb; padding-top: 12px;">
      <h4 style="margin: 0 0 8px 0; font-size: 13px; color: #64748b;">Legend</h4>
      <div style="display: flex; gap: 20px; font-size: 12px;">
        <div style="display: flex; align-items: center; gap: 6px;">
          <div style="width: 16px; height: 16px; background: #ef4444; border-radius: 50%;"></div>
          <span>Executive</span>
        </div>
        <div style="display: flex; align-items: center; gap: 6px;">
          <div style="width: 16px; height: 16px; background: #f59e0b; border-radius: 50%;"></div>
          <span>Manager</span>
        </div>
        <div style="display: flex; align-items: center; gap: 6px;">
          <div style="width: 16px; height: 16px; background: #3b82f6; border-radius: 50%;"></div>
          <span>Engineer</span>
        </div>
        <div style="display: flex; align-items: center; gap: 6px;">
          <div style="width: 16px; height: 16px; background: #8b5cf6; border-radius: 50%;"></div>
          <span>Designer</span>
        </div>
      </div>
    </div>
  `;

  controlsContainer.innerHTML = html;
  document.body.appendChild(controlsContainer);

  // Get control elements
  const btnPrev = document.getElementById('btn-prev') as HTMLButtonElement;
  const btnNext = document.getElementById('btn-next') as HTMLButtonElement;
  const btnAuto = document.getElementById('btn-auto') as HTMLButtonElement;
  const btnReset = document.getElementById('btn-reset') as HTMLButtonElement;
  const stageLabel = document.getElementById('stage-label') as HTMLDivElement;
  const stageNum = document.getElementById('stage-num') as HTMLSpanElement;

  let autoPlayInterval: any = null;

  const updateStage = async (newStage: number) => {
    if (newStage < 0 || newStage >= stages.length) return;
    
    currentStage = newStage;
    const stage = stages[currentStage];
    
    stageLabel.textContent = stage.label;
    stageNum.textContent = (currentStage + 1).toString();
    
    btnPrev.disabled = currentStage === 0;
    btnNext.disabled = currentStage === stages.length - 1;
    
    await updateGraphAnimated(stage.data);
  };

  btnPrev.addEventListener('click', () => {
    if (autoPlayInterval) {
      clearInterval(autoPlayInterval);
      autoPlayInterval = null;
      btnAuto.textContent = '▶ Auto Play';
    }
    updateStage(currentStage - 1);
  });

  btnNext.addEventListener('click', () => {
    if (autoPlayInterval) {
      clearInterval(autoPlayInterval);
      autoPlayInterval = null;
      btnAuto.textContent = '▶ Auto Play';
    }
    updateStage(currentStage + 1);
  });

  btnAuto.addEventListener('click', () => {
    if (autoPlayInterval) {
      clearInterval(autoPlayInterval);
      autoPlayInterval = null;
      btnAuto.textContent = '▶ Auto Play';
    } else {
      btnAuto.textContent = '⏸ Pause';
      autoPlayInterval = setInterval(async () => {
        if (currentStage < stages.length - 1) {
          await updateStage(currentStage + 1);
        } else {
          clearInterval(autoPlayInterval);
          autoPlayInterval = null;
          btnAuto.textContent = '▶ Auto Play';
        }
      }, 2500);
    }
  });

  btnReset.addEventListener('click', () => {
    if (autoPlayInterval) {
      clearInterval(autoPlayInterval);
      autoPlayInterval = null;
      btnAuto.textContent = '▶ Auto Play';
    }
    currentStage = 0;
    existingNodeIds.clear();
    previousPositions.clear();
    
    // Reinitialize
    if (currentGraph) {
      currentGraph.setData(initialData);
      existingNodeIds = new Set(initialData.nodes.map(n => n.id));
      
      setTimeout(() => {
        initialData.nodes.forEach(node => {
          const nodeEl = document.querySelector(`[data-node-id="${node.id}"]`) as any;
          if (nodeEl && nodeEl.__edgecraft_node) {
            const n = nodeEl.__edgecraft_node;
            if (n.x !== undefined && n.y !== undefined) {
              previousPositions.set(node.id, { x: n.x, y: n.y });
            }
          }
        });
      }, 500);
      
      stageLabel.textContent = stages[0].label;
      stageNum.textContent = '1';
      btnPrev.disabled = true;
      btnNext.disabled = false;
    }
  });

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
    <h3 style="margin: 0 0 10px 0; font-size: 15px; color: #1f2937;">Animated Adaptive Layout</h3>
    <p style="margin: 0 0 10px 0; color: #64748b;">
      Watch as the organization grows! New nodes are smoothly animated into position
      while existing nodes stay mostly in place.
    </p>
    <p style="margin: 0; color: #64748b;">
      <strong>Features:</strong>
    </p>
    <ul style="margin: 8px 0 0 0; padding-left: 20px; color: #64748b;">
      <li>Smooth layout animations</li>
      <li>Adaptive positioning</li>
      <li>Preserved node locations</li>
      <li>Minimal disruption</li>
      <li>No randomization</li>
    </ul>
  `;
  container.appendChild(description);

  // Cleanup
  const cleanup = () => {
    if (autoPlayInterval) {
      clearInterval(autoPlayInterval);
    }
    if (controlsContainer && controlsContainer.parentNode) {
      controlsContainer.remove();
    }
    if (description && description.parentNode) {
      description.remove();
    }
    layoutAnimator.stop();
  };

  (window as any).__animatedAdaptiveCleanup = cleanup;
  window.addEventListener('beforeunload', cleanup, { once: true });
}
