/**
 * Overflow-safe popover positioning utility
 * Deep-thinks before rendering a popover to find optimal placement
 */

export type PopoverPlacement = 'bottom' | 'top' | 'right' | 'left';

export interface PopoverPosition {
  x: number;
  y: number;
  placement: PopoverPlacement;
  maxWidth: number;
  maxHeight: number;
  requiresScroll: boolean;
}

export interface PopoverDimensions {
  width: number;
  height: number;
}

export interface ViewportInfo {
  width: number;
  height: number;
  scrollX: number;
  scrollY: number;
  safeInsets: {
    top: number;
    right: number;
    bottom: number;
    left: number;
  };
}

const POPOVER_OFFSET = 12; // 8-12px as specified
const MIN_VIEWPORT_MARGIN = 16; // Minimum margin from viewport edges
const MAX_POPOVER_WIDTH = 520;
const MAX_POPOVER_HEIGHT_VH = 60; // 60vh max height
const VIEWPORT_PERCENTAGE = 92; // 92vw/92vh max

/**
 * Get current viewport information including safe insets
 */
export function getViewportInfo(): ViewportInfo {
  const width = window.innerWidth;
  const height = window.innerHeight;
  const scrollX = window.scrollX;
  const scrollY = window.scrollY;

  // Safe insets for mobile devices (notches, etc.)
  const safeInsets = {
    top: parseInt(getComputedStyle(document.documentElement).getPropertyValue('--safe-area-inset-top') || '0'),
    right: parseInt(getComputedStyle(document.documentElement).getPropertyValue('--safe-area-inset-right') || '0'),
    bottom: parseInt(getComputedStyle(document.documentElement).getPropertyValue('--safe-area-inset-bottom') || '0'),
    left: parseInt(getComputedStyle(document.documentElement).getPropertyValue('--safe-area-inset-left') || '0')
  };

  return { width, height, scrollX, scrollY, safeInsets };
}

/**
 * Calculate available space for each placement option
 */
function calculateAvailableSpace(
  anchorRect: DOMRect,
  viewport: ViewportInfo
): Record<PopoverPlacement, { width: number; height: number }> {
  const { width: vw, height: vh, safeInsets } = viewport;
  
  return {
    bottom: {
      width: vw - safeInsets.left - safeInsets.right - (MIN_VIEWPORT_MARGIN * 2),
      height: vh - anchorRect.bottom - safeInsets.bottom - MIN_VIEWPORT_MARGIN - POPOVER_OFFSET
    },
    top: {
      width: vw - safeInsets.left - safeInsets.right - (MIN_VIEWPORT_MARGIN * 2),
      height: anchorRect.top - safeInsets.top - MIN_VIEWPORT_MARGIN - POPOVER_OFFSET
    },
    right: {
      width: vw - anchorRect.right - safeInsets.right - MIN_VIEWPORT_MARGIN - POPOVER_OFFSET,
      height: vh - safeInsets.top - safeInsets.bottom - (MIN_VIEWPORT_MARGIN * 2)
    },
    left: {
      width: anchorRect.left - safeInsets.left - MIN_VIEWPORT_MARGIN - POPOVER_OFFSET,
      height: vh - safeInsets.top - safeInsets.bottom - (MIN_VIEWPORT_MARGIN * 2)
    }
  };
}

/**
 * Choose the best placement based on available space
 * Priority: bottom → top → right → left (as specified)
 */
function chooseBestPlacement(
  availableSpace: Record<PopoverPlacement, { width: number; height: number }>,
  requiredDimensions: PopoverDimensions
): PopoverPlacement {
  const placements: PopoverPlacement[] = ['bottom', 'top', 'right', 'left'];
  
  // First try to find a placement that fits completely
  for (const placement of placements) {
    const space = availableSpace[placement];
    if (space.width >= requiredDimensions.width && space.height >= requiredDimensions.height) {
      return placement;
    }
  }
  
  // If none fit completely, choose the one with the largest area
  let bestPlacement: PopoverPlacement = 'bottom';
  let largestArea = 0;
  
  for (const placement of placements) {
    const space = availableSpace[placement];
    const area = Math.max(0, space.width) * Math.max(0, space.height);
    if (area > largestArea) {
      largestArea = area;
      bestPlacement = placement;
    }
  }
  
  return bestPlacement;
}

/**
 * Calculate popover position with overflow handling
 */
function calculatePosition(
  anchorRect: DOMRect,
  placement: PopoverPlacement,
  availableSpace: Record<PopoverPlacement, { width: number; height: number }>,
  viewport: ViewportInfo
): { x: number; y: number; maxWidth: number; maxHeight: number } {
  const space = availableSpace[placement];
  const { scrollX, scrollY, safeInsets } = viewport;
  
  // Apply viewport percentage constraints
  const maxWidth = Math.min(
    MAX_POPOVER_WIDTH,
    Math.floor(viewport.width * (VIEWPORT_PERCENTAGE / 100)),
    Math.max(0, space.width)
  );
  
  const maxHeight = Math.min(
    Math.floor(viewport.height * (MAX_POPOVER_HEIGHT_VH / 100)),
    Math.floor(viewport.height * (VIEWPORT_PERCENTAGE / 100)),
    Math.max(0, space.height)
  );
  
  let x: number;
  let y: number;
  
  switch (placement) {
    case 'bottom':
      x = anchorRect.left + scrollX + (anchorRect.width / 2) - (maxWidth / 2);
      y = anchorRect.bottom + scrollY + POPOVER_OFFSET;
      // Clamp x to viewport bounds
      x = Math.max(
        safeInsets.left + MIN_VIEWPORT_MARGIN,
        Math.min(x, viewport.width + scrollX - maxWidth - safeInsets.right - MIN_VIEWPORT_MARGIN)
      );
      break;
      
    case 'top':
      x = anchorRect.left + scrollX + (anchorRect.width / 2) - (maxWidth / 2);
      y = anchorRect.top + scrollY - maxHeight - POPOVER_OFFSET;
      // Clamp x to viewport bounds
      x = Math.max(
        safeInsets.left + MIN_VIEWPORT_MARGIN,
        Math.min(x, viewport.width + scrollX - maxWidth - safeInsets.right - MIN_VIEWPORT_MARGIN)
      );
      break;
      
    case 'right':
      x = anchorRect.right + scrollX + POPOVER_OFFSET;
      y = anchorRect.top + scrollY + (anchorRect.height / 2) - (maxHeight / 2);
      // Clamp y to viewport bounds
      y = Math.max(
        safeInsets.top + MIN_VIEWPORT_MARGIN,
        Math.min(y, viewport.height + scrollY - maxHeight - safeInsets.bottom - MIN_VIEWPORT_MARGIN)
      );
      break;
      
    case 'left':
      x = anchorRect.left + scrollX - maxWidth - POPOVER_OFFSET;
      y = anchorRect.top + scrollY + (anchorRect.height / 2) - (maxHeight / 2);
      // Clamp y to viewport bounds
      y = Math.max(
        safeInsets.top + MIN_VIEWPORT_MARGIN,
        Math.min(y, viewport.height + scrollY - maxHeight - safeInsets.bottom - MIN_VIEWPORT_MARGIN)
      );
      break;
  }
  
  return { x, y, maxWidth, maxHeight };
}

/**
 * Main function to calculate optimal popover position
 * Deep-thinks about placement before rendering
 */
export function calculatePopoverPosition(
  anchorElement: HTMLElement,
  popoverDimensions: PopoverDimensions
): PopoverPosition {
  // Measure anchor rect and viewport
  const anchorRect = anchorElement.getBoundingClientRect();
  const viewport = getViewportInfo();
  
  // Calculate available space for each placement
  const availableSpace = calculateAvailableSpace(anchorRect, viewport);
  
  // Choose the placement with the largest free area
  const placement = chooseBestPlacement(availableSpace, popoverDimensions);
  
  // Calculate final position with overflow handling
  const { x, y, maxWidth, maxHeight } = calculatePosition(
    anchorRect,
    placement,
    availableSpace,
    viewport
  );
  
  // Determine if scrolling is required
  const requiresScroll = 
    popoverDimensions.width > maxWidth || 
    popoverDimensions.height > maxHeight;
  
  return {
    x,
    y,
    placement,
    maxWidth,
    maxHeight,
    requiresScroll
  };
}

/**
 * Create a resize/scroll observer for popover repositioning
 */
export function createPopoverObserver(
  anchorElement: HTMLElement,
  popoverElement: HTMLElement,
  onReposition: (position: PopoverPosition) => void,
  getDimensions: () => PopoverDimensions
): () => void {
  let resizeObserver: ResizeObserver | null = null;
  let isRepositioning = false;
  
  const reposition = () => {
    if (isRepositioning) return;
    isRepositioning = true;
    
    requestAnimationFrame(() => {
      const dimensions = getDimensions();
      const position = calculatePopoverPosition(anchorElement, dimensions);
      onReposition(position);
      isRepositioning = false;
    });
  };
  
  // Listen for window resize and scroll
  const handleWindowChange = () => reposition();
  window.addEventListener('resize', handleWindowChange);
  window.addEventListener('scroll', handleWindowChange, true); // Use capture for all scroll events
  
  // Listen for anchor element size changes
  if (ResizeObserver) {
    resizeObserver = new ResizeObserver(reposition);
    resizeObserver.observe(anchorElement);
  }
  
  // Listen for popover content size changes
  if (ResizeObserver && popoverElement) {
    resizeObserver?.observe(popoverElement);
  }
  
  // Return cleanup function
  return () => {
    window.removeEventListener('resize', handleWindowChange);
    window.removeEventListener('scroll', handleWindowChange, true);
    if (resizeObserver) {
      resizeObserver.disconnect();
    }
  };
}