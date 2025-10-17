/**
 * PNG Export Utility - Complete PNG Export System
 * Handles all PNG export functionality for charts
 */

export interface PngExportOptions {
  width?: number;
  height?: number;
  scale?: number;
  backgroundColor?: string;
  quality?: number;
}

export interface ChartExportInfo {
  columnName: string;
  chartType: string;
  dataRecords: number;
  timestamp: string;
  suffix?: string;
}

/**
 * Main PNG export function - handles both SVG and HTML elements
 */
export async function exportElementToPng(
  element: Element,
  options: PngExportOptions = {}
): Promise<Blob> {
  console.log('🚀 PNG Export - Starting export process');
  
  if (element instanceof SVGElement) {
    return convertSvgToPng(element, options);
  } else if (element instanceof HTMLElement) {
    return convertHtmlToPng(element, options);
  } else {
    throw new Error('Unsupported element type for PNG export');
  }
}

/**
 * SVG to PNG conversion
 */
async function convertSvgToPng(
  svgElement: SVGElement,
  options: PngExportOptions
): Promise<Blob> {
  const { width = 0, height = 0, scale = 2.0, backgroundColor = '#0f0f23', quality = 0.95 } = options;
  
  // Clone the SVG to avoid modifying the original
  const svgClone = svgElement.cloneNode(true) as SVGElement;
  
  // Remove any height constraints from the SVG
  svgClone.style.maxHeight = 'none';
  svgClone.style.height = 'auto';
  svgClone.style.overflow = 'visible';
  
  // Initialize variables in function scope - handle 0 dimensions
  let actualSvgWidth = width || 800; // Fallback if 0
  let actualSvgHeight = height || 600; // Fallback if 0
  
  try {
    // Get actual SVG dimensions for proper scaling
    if (!('getBBox' in svgElement)) {
      throw new Error('getBBox is not available on the provided SVG element');
    }

    const svgBBox = (svgElement as SVGGraphicsElement).getBBox();
    // Always use SVG's natural size, with fallbacks
    actualSvgWidth = svgBBox.width || actualSvgWidth;
    actualSvgHeight = svgBBox.height || actualSvgHeight;
    
    // Balanced minimum size - not too small, not too big
    actualSvgWidth = Math.max(actualSvgWidth, 350);
    actualSvgHeight = Math.max(actualSvgHeight, 250);
    
    // Set explicit dimensions based on content
    svgClone.setAttribute('width', actualSvgWidth.toString());
    svgClone.setAttribute('height', actualSvgHeight.toString());
    svgClone.setAttribute('viewBox', `0 0 ${actualSvgWidth} ${actualSvgHeight}`);
    
    console.log('📏 SVG PNG Export - Natural dimensions:', { 
      bboxWidth: svgBBox.width, 
      bboxHeight: svgBBox.height, 
      finalWidth: actualSvgWidth, 
      finalHeight: actualSvgHeight,
      isResponsive: width === 0 && height === 0
    });
  } catch (error) {
    // Fallback if getBBox fails
    console.warn('Could not get SVG BBox, using default dimensions');
    svgClone.setAttribute('width', actualSvgWidth.toString());
    svgClone.setAttribute('height', actualSvgHeight.toString());
    svgClone.setAttribute('viewBox', `0 0 ${actualSvgWidth} ${actualSvgHeight}`);
  }
  
  // Ensure all styles are inline for proper rendering
  inlineStyles(svgClone);
  
  // Create canvas - use SVG's actual dimensions
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d')!;
  
  // Perfect fit canvas - exact size match
  canvas.width = actualSvgWidth * scale;
  canvas.height = actualSvgHeight * scale;
  ctx.scale(scale, scale);
  
  console.log('🎯 SVG PNG Export - Canvas sizing:', { 
    actualSvgWidth, 
    actualSvgHeight, 
    canvasWidth: canvas.width, 
    canvasHeight: canvas.height,
    scale 
  });
  
  // Background exactly matches SVG
  ctx.fillStyle = backgroundColor;
  ctx.fillRect(0, 0, actualSvgWidth, actualSvgHeight);
  
  // Convert SVG to data URL
  const svgString = new XMLSerializer().serializeToString(svgClone);
  const svgDataUrl = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svgString)}`;
  
  // Create image and draw to canvas
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      try {
        ctx.drawImage(img, 0, 0, actualSvgWidth, actualSvgHeight);
        canvas.toBlob((blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error('Failed to create PNG blob'));
          }
        }, 'image/png', quality);
      } catch (error) {
        reject(error);
      }
    };
    img.onerror = () => reject(new Error('Failed to load SVG image'));
    img.src = svgDataUrl;
  });
}

/**
 * HTML to PNG conversion
 */
async function convertHtmlToPng(
  htmlElement: HTMLElement,
  options: PngExportOptions
): Promise<Blob> {
  const { width = 0, height = 0, scale = 2, backgroundColor = '#0f0f23', quality = 0.95 } = options;
  
  // Create a temporary container
  const tempContainer = document.createElement('div');
  tempContainer.style.position = 'fixed';
  tempContainer.style.top = '-10000px';
  tempContainer.style.left = '-10000px';
  tempContainer.style.width = `${width || 800}px`;
  tempContainer.style.height = `${height || 600}px`;
  tempContainer.style.backgroundColor = backgroundColor;
  tempContainer.style.padding = '40px';
  tempContainer.style.overflow = 'visible';
  tempContainer.style.boxSizing = 'border-box';
  tempContainer.style.display = 'flex';
  tempContainer.style.alignItems = 'center';
  tempContainer.style.justifyContent = 'center';
  tempContainer.style.fontFamily = '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif';
  
  // Clone the element
  const elementClone = htmlElement.cloneNode(true) as HTMLElement;
  elementClone.style.width = `${(width || 800) - 80}px`;
  elementClone.style.height = `${(height || 600) - 80}px`;
  elementClone.style.maxWidth = `${(width || 800) - 80}px`;
  elementClone.style.maxHeight = `${(height || 600) - 80}px`;
  // Remove problematic transform scale
  elementClone.style.transform = 'none';
  elementClone.style.transformOrigin = 'center center';
  elementClone.style.overflow = 'visible';
  elementClone.style.position = 'relative';
  
  tempContainer.appendChild(elementClone);
  document.body.appendChild(tempContainer);
  
  // Wait for render and layout stabilization
  await new Promise(resolve => setTimeout(resolve, 300));
  
  // Make container fully responsive to content
  if (elementClone instanceof HTMLElement) {
    // Remove size constraints that prevent natural sizing
    elementClone.style.cssText += `
      max-height: none !important;
      height: auto !important;
      overflow: visible !important;
      max-width: none !important;
      width: auto !important;
      flex: none !important;
      position: static !important;
    `;
    
    // Find chart-specific elements and make them responsive
    const chartElements = elementClone.querySelectorAll('[class*="chart"], [class*="Chart"], .simpleChart');
    chartElements.forEach(element => {
      if (element instanceof HTMLElement) {
        element.style.cssText += `
          max-height: none !important;
          height: auto !important;
          overflow: visible !important;
          max-width: none !important;
          width: 100% !important;
          flex: none !important;
        `;
      }
    });
    
    // Special handling for bar charts - prevent compression
    const barContainers = elementClone.querySelectorAll('[class*="bar"], [class*="Bar"]');
    barContainers.forEach(element => {
      if (element instanceof HTMLElement) {
        element.style.cssText += `
          max-height: none !important;
          height: auto !important;
          min-height: auto !important;
          overflow: visible !important;
          flex-shrink: 0 !important;
          transform: none !important;
        `;
      }
    });
    
    // Also fix any chart containers that might compress bar charts
    const allContainers = elementClone.querySelectorAll('div, section, article');
    allContainers.forEach(container => {
      if (container instanceof HTMLElement && 
          (container.className.includes('chart') || 
           container.className.includes('Chart') ||
           container.textContent?.includes('bar') ||
           container.querySelector('[class*="bar"]'))) {
        container.style.cssText += `
          min-height: auto !important;
          flex-shrink: 0 !important;
        `;
      }
    });
  }
  
  // Force a reflow to get correct dimensions
  elementClone.offsetHeight;
  
  // Wait additional time for layout to stabilize after style changes
  await new Promise(resolve => setTimeout(resolve, 500));
  
  // DEBUG: Get actual rendered dimensions after fixes
  const computedStyle = window.getComputedStyle(elementClone);
  const actualWidth = elementClone.getBoundingClientRect().width;
  const actualHeight = elementClone.getBoundingClientRect().height;
  console.log('📏 HTML PNG Export - Final dimensions:', { 
    actualWidth, 
    actualHeight,
    isResponsive: width === 0 && height === 0,
    originalRequest: { width, height }
  });
  console.log('📏 HTML PNG Export - Element info:', { 
    tagName: elementClone.tagName,
    className: elementClone.className,
    computedWidth: computedStyle.width, 
    computedHeight: computedStyle.height
  });
  
  try {
    // FULLY RESPONSIVE: Always use actual chart dimensions
    // No forced minimums - let charts be their natural size
    const contentWidth = actualWidth > 0 ? actualWidth : (width || 650);
    const contentHeight = actualHeight > 0 ? actualHeight : (height || 450);
    
    // Smaller PNG size with adequate padding
    const svgWidth = contentWidth + 60; 
    const svgHeight = contentHeight + 60;
    
    console.log('🔍 HTML PNG Export - SVG dimensions:', { svgWidth, svgHeight, contentWidth, contentHeight });
    
    const foreignObject = document.createElementNS('http://www.w3.org/2000/svg', 'foreignObject');
    
    // Center the content in the available space
    const xOffset = (svgWidth - contentWidth) / 2;
    const yOffset = (svgHeight - contentHeight) / 2;
    
    foreignObject.setAttribute('x', Math.max(0, xOffset).toString());
    foreignObject.setAttribute('y', Math.max(0, yOffset).toString());
    foreignObject.setAttribute('width', contentWidth.toString());
    foreignObject.setAttribute('height', contentHeight.toString());
    
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('width', svgWidth.toString());
    svg.setAttribute('height', svgHeight.toString());
    svg.setAttribute('viewBox', `0 0 ${svgWidth} ${svgHeight}`);
    
    // Add background
    const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    rect.setAttribute('x', '0');
    rect.setAttribute('y', '0');
    rect.setAttribute('width', '100%');
    rect.setAttribute('height', '100%');
    rect.setAttribute('fill', backgroundColor);
    svg.appendChild(rect);
    
    // Create a wrapper div with more padding
    const wrapper = document.createElement('div');
    wrapper.style.width = '100%';
    wrapper.style.height = '100%';
    wrapper.style.padding = '25px';
    wrapper.style.boxSizing = 'border-box';
    wrapper.style.overflow = 'visible';
    wrapper.style.fontFamily = '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif';
    wrapper.style.color = '#ffffff';
    wrapper.style.fontSize = '8px';
    wrapper.style.fontWeight = '500';
    
    const finalClone = elementClone.cloneNode(true) as HTMLElement;
    
    // Fix text styling in the cloned element
    const textElements = finalClone.querySelectorAll('*');
    textElements.forEach(el => {
      const htmlEl = el as HTMLElement;
      if (htmlEl.style) {
        htmlEl.style.color = '#ffffff';
        htmlEl.style.fontFamily = '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif';
        htmlEl.style.fontSize = '8px';
        htmlEl.style.fontWeight = '500';
        htmlEl.style.lineHeight = '1.3';
        htmlEl.style.letterSpacing = '0.2px';
        htmlEl.style.textAlign = 'center';
      }
    });
    
    wrapper.appendChild(finalClone);
    
    foreignObject.appendChild(wrapper);
    svg.appendChild(foreignObject);
    
    // Convert to canvas - use actual chart size
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;
    
    // Canvas size should match the actual content size
    const finalCanvasWidth = svgWidth * scale;
    const finalCanvasHeight = svgHeight * scale;
    
    console.log('🔍 HTML PNG Export - Canvas dimensions (content-based):', { 
      finalCanvasWidth, 
      finalCanvasHeight, 
      scale,
      originalRequestedSize: { width, height }
    });
    
    canvas.width = finalCanvasWidth;
    canvas.height = finalCanvasHeight;
    ctx.scale(scale, scale);
    
    // Set high quality rendering
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    
    const svgString = new XMLSerializer().serializeToString(svg);
    console.log('🔍 HTML PNG Export - SVG String (first 200 chars):', svgString.substring(0, 200));
    const svgDataUrl = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svgString)}`;
    
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        try {
          console.log('🔍 HTML PNG Export - Image loaded, drawing to canvas');
          ctx.drawImage(img, 0, 0, svgWidth, svgHeight);
          canvas.toBlob((blob) => {
            if (blob) {
              console.log('✅ HTML PNG Export - Success! Blob size:', blob.size);
              resolve(blob);
            } else {
              reject(new Error('Failed to create PNG blob'));
            }
          }, 'image/png', quality);
        } catch (error) {
          reject(error);
        }
      };
      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = svgDataUrl;
    });
    
  } catch (error) {
    console.error('HTML PNG Export failed:', error);
    throw error;
  } finally {
    // Clean up
    if (tempContainer.parentNode) {
      tempContainer.parentNode.removeChild(tempContainer);
    }
  }
}

/**
 * Inline styles for SVG elements
 */
function inlineStyles(element: Element): void {
  // Apply essential styles for SVG text rendering
  if (element.tagName === 'text') {
    const textElement = element as SVGTextElement;
    
    // Force proper text styling for export
    textElement.style.fontFamily = '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif';
    textElement.style.fontSize = '8px';
    textElement.style.fill = '#ffffff';
    textElement.style.fontWeight = '500';
    textElement.style.dominantBaseline = 'central';
    textElement.style.textAnchor = 'middle';
    
    // Prevent text overlapping
    textElement.style.letterSpacing = '0.3px';
    textElement.style.wordSpacing = '1px';
    
    // Ensure visibility
    textElement.setAttribute('fill', '#ffffff');
    textElement.setAttribute('font-size', '8');
    textElement.setAttribute('font-family', '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif');
    textElement.setAttribute('font-weight', '500');
    textElement.setAttribute('dominant-baseline', 'central');
    textElement.setAttribute('text-anchor', 'middle');
  }
  
  // Handle HTML text elements in foreign objects
  if (element.tagName === 'div' || element.tagName === 'span') {
    const htmlElement = element as HTMLElement;
    htmlElement.style.fontFamily = '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif';
    htmlElement.style.fontSize = '8px';
    htmlElement.style.color = '#ffffff';
    htmlElement.style.fontWeight = '500';
    htmlElement.style.lineHeight = '1.2';
    htmlElement.style.letterSpacing = '0.3px';
  }
  
  // Recursively process child elements
  Array.from(element.children).forEach(child => inlineStyles(child));
}

/**
 * Generate filename for PNG export
 */
export function generateFilename(chartInfo: ChartExportInfo): string {
  const { columnName, chartType, dataRecords, timestamp, suffix } = chartInfo;
  
  // Clean column name for filename
  const cleanColumnName = columnName
    .replace(/[^a-zA-Z0-9]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
  
  // Clean timestamp for filename
  const cleanTimestamp = timestamp.replace(/[T:]/g, '-').replace(/\..+$/, '');
  
  // Create filename parts
  const parts = [
    'chart',
    cleanColumnName,
    chartType,
    `${dataRecords}records`,
    cleanTimestamp
  ];
  
  if (suffix) {
    parts.push(suffix);
  }
  
  return `${parts.join('-')}.png`;
}

/**
 * Download blob as file
 */
export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.style.display = 'none';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  // Clean up
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
