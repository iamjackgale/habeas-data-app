import html2canvas from 'html2canvas';

/**
 * Convert a widget DOM element to PNG and trigger download
 * @param element - The DOM element containing the widget
 * @param filename - Optional filename for the downloaded image (default: 'widget.png')
 */
export async function downloadWidgetAsPNG(
  element: HTMLElement,
  filename: string = 'widget.png'
): Promise<void> {
  try {
    // Wait a bit to ensure widget is fully rendered (especially for charts)
    await new Promise(resolve => setTimeout(resolve, 500));

    // Check if element is still in DOM
    if (!element || !element.isConnected) {
      throw new Error('Widget element is not in the DOM');
    }

    // Scroll element into view to ensure it's rendered
    element.scrollIntoView({ behavior: 'instant', block: 'nearest' });
    
    // Wait a bit more after scrolling
    await new Promise(resolve => setTimeout(resolve, 200));

    // Get computed background color and handle oklch/unsupported color formats
    const computedStyle = window.getComputedStyle(element);
    let backgroundColor = computedStyle.backgroundColor;
    
    // Check if background color contains unsupported formats (oklch, lab, etc.)
    if (backgroundColor && (backgroundColor.includes('oklch') || backgroundColor.includes('lab') || backgroundColor.includes('color('))) {
      // Try to get a fallback color from CSS variables or use white
      backgroundColor = '#ffffff';
      console.warn('Unsupported color format detected, using white fallback');
    }
    
    // Handle transparent backgrounds
    if (!backgroundColor || backgroundColor === 'rgba(0, 0, 0, 0)' || backgroundColor === 'transparent') {
      // Try to get background from parent or use white
      const parent = element.parentElement;
      if (parent) {
        const parentStyle = window.getComputedStyle(parent);
        let parentBg = parentStyle.backgroundColor;
        // Check parent background for unsupported formats too
        if (parentBg && (parentBg.includes('oklch') || parentBg.includes('lab') || parentBg.includes('color('))) {
          parentBg = '#ffffff';
        }
        if (parentBg && parentBg !== 'rgba(0, 0, 0, 0)' && parentBg !== 'transparent') {
          backgroundColor = parentBg;
        }
      }
      if (!backgroundColor || backgroundColor === 'rgba(0, 0, 0, 0)' || backgroundColor === 'transparent') {
        backgroundColor = '#ffffff';
      }
    }
    
    // Get element dimensions
    const rect = element.getBoundingClientRect();
    const width = Math.max(rect.width, element.scrollWidth, element.offsetWidth);
    const height = Math.max(rect.height, element.scrollHeight, element.offsetHeight);

    if (width === 0 || height === 0) {
      throw new Error('Widget element has zero dimensions');
    }

    console.log('Capturing widget:', { width, height, backgroundColor });
    
    // Create overlay to hide the formatting chaos
    const overlay = document.createElement('div');
    overlay.id = 'html2canvas-overlay';
    overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      z-index: 999999;
      background-color: ${document.documentElement.classList.contains('dark') ? '#000000' : '#ffffff'};
      display: flex;
      align-items: center;
      justify-content: center;
    `;
    document.body.appendChild(overlay);
    
    // Store original link/style tags to restore later
    const removedStyleSheets: Array<{ node: Node; parent: Node | null; nextSibling: Node | null }> = [];
    
    // Temporarily remove all stylesheets that might contain oklch
    // We'll restore them after capture
    const allStyleSheets = Array.from(document.querySelectorAll('style, link[rel="stylesheet"]'));
    allStyleSheets.forEach((sheet) => {
      if (sheet.parentNode) {
        removedStyleSheets.push({ 
          node: sheet, 
          parent: sheet.parentNode, 
          nextSibling: sheet.nextSibling 
        });
        sheet.parentNode.removeChild(sheet);
      }
    });
    
    // Inject a simple override style with only rgb colors
    const overrideStyle = document.createElement('style');
    overrideStyle.id = 'html2canvas-oklch-override';
    overrideStyle.textContent = `
      * {
        background-color: ${backgroundColor} !important;
        color: ${backgroundColor && backgroundColor !== '#ffffff' ? 'rgb(255, 255, 255)' : 'rgb(0, 0, 0)'} !important;
        border-color: rgb(204, 204, 204) !important;
      }
    `;
    document.head.appendChild(overrideStyle);
    
    try {
      // Wait a moment for styles to apply
      await new Promise(resolve => setTimeout(resolve, 200));
      
      // Configure html2canvas options - use proxy to intercept stylesheet requests
      const canvas = await html2canvas(element, {
        backgroundColor: backgroundColor,
        scale: 2, // Higher resolution
        logging: false, // Disable logging for production
        useCORS: true,
        allowTaint: false,
        foreignObjectRendering: false, // Disable to avoid oklch parsing issues
        removeContainer: false,
        width: width,
        height: height,
        x: 0,
        y: 0,
        proxy: undefined, // Don't use proxy
        onclone: (clonedDoc) => {
          // Remove ALL stylesheets from cloned document
          const styleSheets = Array.from(clonedDoc.querySelectorAll('style, link[rel="stylesheet"]'));
          styleSheets.forEach((sheet) => {
            try {
              sheet.remove();
            } catch (e) {
              console.warn('Could not remove stylesheet:', e);
            }
          });
          
          // Add only our simple override style with rgb colors
          const clonedStyle = clonedDoc.createElement('style');
          clonedStyle.textContent = `
            * {
              background-color: ${backgroundColor} !important;
              color: ${backgroundColor && backgroundColor !== '#ffffff' ? 'rgb(255, 255, 255)' : 'rgb(0, 0, 0)'} !important;
              border-color: rgb(204, 204, 204) !important;
            }
          `;
          clonedDoc.head.appendChild(clonedStyle);
        },
      });
      
      // Remove override style after capture
      document.head.removeChild(overrideStyle);
      
      console.log('Canvas created:', { width: canvas.width, height: canvas.height });

      // Convert canvas to blob using Promise
      const blob = await new Promise<Blob | null>((resolve, reject) => {
        try {
          canvas.toBlob((blob) => {
            resolve(blob);
          }, 'image/png', 1.0); // Highest quality
        } catch (error) {
          reject(error);
        }
      });

      if (!blob) {
        throw new Error('Failed to create blob from canvas');
      }

      console.log('Blob created:', { size: blob.size, type: blob.type });

      // Create download link
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      link.style.display = 'none';
      document.body.appendChild(link);
      link.click();
      
      // Clean up
      setTimeout(() => {
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      }, 100);

      console.log('Download initiated');
    } finally {
      // Remove overlay first
      const overlay = document.getElementById('html2canvas-overlay');
      if (overlay) {
        document.body.removeChild(overlay);
      }
      
      // Restore original stylesheets
      removedStyleSheets.forEach(({ node, parent, nextSibling }) => {
        if (node && parent) {
          if (nextSibling) {
            parent.insertBefore(node, nextSibling);
          } else {
            parent.appendChild(node);
          }
        }
      });
      
      // Remove override style
      const overrideStyle = document.getElementById('html2canvas-oklch-override');
      if (overrideStyle) {
        document.head.removeChild(overrideStyle);
      }
    }
  } catch (error) {
    console.error('Error downloading widget as PNG:', error);
    
    // Remove overlay on error
    const overlay = document.getElementById('html2canvas-overlay');
    if (overlay) {
      document.body.removeChild(overlay);
    }
    
    // Restore original stylesheets on error
    removedStyleSheets.forEach(({ node, parent, nextSibling }) => {
      if (node && parent) {
        if (nextSibling) {
          parent.insertBefore(node, nextSibling);
        } else {
          parent.appendChild(node);
        }
      }
    });
    
    // Clean up override style on error
    const overrideStyle = document.getElementById('html2canvas-oklch-override');
    if (overrideStyle) {
      document.head.removeChild(overrideStyle);
    }
    // Provide more specific error messages
    if (error instanceof Error) {
      throw new Error(`Failed to download widget: ${error.message}`);
    }
    throw error;
  }
}

