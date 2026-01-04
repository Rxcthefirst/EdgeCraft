/**
 * Layout Animator
 * 
 * Provides smooth transitions between layout positions
 * Interpolates node positions over time for fluid animations
 */

import { Position } from '../types';

export interface AnimationConfig {
  /**
   * Duration of animation in milliseconds
   * @default 500
   */
  duration?: number;
  
  /**
   * Easing function
   * @default 'easeInOutCubic'
   */
  easing?: 'linear' | 'easeInOutQuad' | 'easeInOutCubic' | 'easeOutElastic';
  
  /**
   * Callback for each frame
   */
  onFrame?: (progress: number) => void;
  
  /**
   * Callback when animation completes
   */
  onComplete?: () => void;
}

export interface NodeTransition {
  id: string | number;
  fromX: number;
  fromY: number;
  toX: number;
  toY: number;
}

export class LayoutAnimator {
  private animationFrameId: number | null = null;
  private startTime: number = 0;
  private isAnimating: boolean = false;
  
  /**
   * Easing functions
   */
  private easingFunctions = {
    linear: (t: number) => t,
    
    easeInOutQuad: (t: number) => {
      return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
    },
    
    easeInOutCubic: (t: number) => {
      return t < 0.5
        ? 4 * t * t * t
        : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1;
    },
    
    easeOutElastic: (t: number) => {
      const c4 = (2 * Math.PI) / 3;
      return t === 0
        ? 0
        : t === 1
        ? 1
        : Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * c4) + 1;
    }
  };
  
  /**
   * Animate positions from old to new
   */
  animate(
    transitions: NodeTransition[],
    positions: Map<string | number, Position>,
    config: AnimationConfig = {}
  ): Promise<void> {
    const {
      duration = 500,
      easing = 'easeInOutCubic',
      onFrame,
      onComplete
    } = config;
    
    // Cancel any existing animation
    this.stop();
    
    return new Promise((resolve) => {
      this.isAnimating = true;
      this.startTime = performance.now();
      
      const easingFn = this.easingFunctions[easing];
      
      const animate = (currentTime: number) => {
        if (!this.isAnimating) {
          resolve();
          return;
        }
        
        const elapsed = currentTime - this.startTime;
        const progress = Math.min(elapsed / duration, 1);
        const easedProgress = easingFn(progress);
        
        // Update positions
        transitions.forEach(transition => {
          const x = transition.fromX + (transition.toX - transition.fromX) * easedProgress;
          const y = transition.fromY + (transition.toY - transition.fromY) * easedProgress;
          
          positions.set(transition.id, { x, y });
        });
        
        // Callback
        if (onFrame) {
          onFrame(easedProgress);
        }
        
        // Continue or complete
        if (progress < 1) {
          this.animationFrameId = requestAnimationFrame(animate);
        } else {
          this.isAnimating = false;
          this.animationFrameId = null;
          
          if (onComplete) {
            onComplete();
          }
          
          resolve();
        }
      };
      
      this.animationFrameId = requestAnimationFrame(animate);
    });
  }
  
  /**
   * Stop current animation
   */
  stop(): void {
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
    this.isAnimating = false;
  }
  
  /**
   * Check if currently animating
   */
  isActive(): boolean {
    return this.isAnimating;
  }
}
