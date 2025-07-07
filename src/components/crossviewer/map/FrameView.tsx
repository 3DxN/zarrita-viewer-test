import { VivView, DETAIL_VIEW_ID, OVERVIEW_VIEW_ID } from '@hms-dbmi/viv'
import { OrthographicView } from '@deck.gl/core'
import { PolygonLayer } from '@deck.gl/layers'
import type { Layer } from '@deck.gl/core'

export const FRAME_VIEW_ID = 'frame';

/**
 * Create a polygon frame overlay layer
 */
export function createFrameOverlayLayer(
  frameCenter: [number, number],
  frameSize: [number, number],
  viewportId: string, // Add viewport ID parameter
  options: {
    fillColor?: [number, number, number, number],
    lineColor?: [number, number, number, number],
    lineWidth?: number,
    filled?: boolean,
    stroked?: boolean,
    includeTestPolygon?: boolean
  } = {}
): PolygonLayer {
  const {
    fillColor = [255, 0, 0, 200] as [number, number, number, number], // Bright red fill
    lineColor = [255, 255, 255, 255] as [number, number, number, number], // White border
    lineWidth = 10,
    filled = true,
    stroked = true,
    includeTestPolygon = true
  } = options;

  const [centerX, centerY] = frameCenter;
  const [width, height] = frameSize;
  const halfWidth = width / 2;
  const halfHeight = height / 2;

  // Create a hollow rectangle polygon (frame)
  const framePolygon = [
    [centerX - halfWidth, centerY - halfHeight],
    [centerX + halfWidth, centerY - halfHeight],
    [centerX + halfWidth, centerY + halfHeight],
    [centerX - halfWidth, centerY + halfHeight],
    [centerX - halfWidth, centerY - halfHeight] // Close the polygon
  ];

  // Create a simple test polygon that should be visible
  const testPolygon = [
    [0, 0],
    [200, 0],
    [200, 200],
    [0, 200],
    [0, 0]
  ];

  const data = [{ contour: framePolygon }];
  if (includeTestPolygon) {
    data.push({ contour: testPolygon });
  }

  console.log('Frame polygon coordinates:', framePolygon);
  console.log('Frame center:', frameCenter, 'Frame size:', frameSize);
  if (includeTestPolygon) {
    console.log('Test polygon coordinates:', testPolygon);
  }

  // Use Viv's layer ID pattern: -#${viewport.id}#
  const layerId = `frame-overlay-#${viewportId}#`;

  const layer = new PolygonLayer({
    id: layerId,
    data,
    getPolygon: d => d.contour,
    getFillColor: () => fillColor,
    getLineColor: () => lineColor,
    getLineWidth: lineWidth,
    lineWidthUnits: 'pixels',
    filled,
    stroked,
    pickable: false, // Make sure it doesn't capture mouse events
    parameters: { depthTest: false }, // Ensure it renders on top
    coordinateSystem: 0, // Use default coordinate system
  });

  console.log(`Layer with viewport ID:`, layerId, layer); // Debug log
  return layer;
}

/**
 * Custom view that renders only a polygon frame overlay.
 * This view is designed to be overlaid on top of other views.
 */
export class FrameView extends VivView {
  constructor({ 
    id = FRAME_VIEW_ID, 
    x = 0, 
    y = 0, 
    height, 
    width
  }: any) {
    super({ id, x, y, height, width });
  }

  /**
   * Create a DeckGL view for the frame overlay.
   * Disable controller to prevent interaction conflicts.
   */
  getDeckGlView() {
    return new OrthographicView({
      controller: false, // Disable controller to prevent interaction conflicts
      id: this.id,
      height: this.height,
      width: this.width,
      x: this.x,
      y: this.y
    });
  }

  /**
   * Return only the frame overlay layer - no base image layers.
   */
  getLayers({ props, viewStates }: any): Layer[] {
    const layers: Layer[] = [];
    
    // Add the frame overlay layer if provided
    if (props.frameOverlayLayer) {
      console.log('Adding frame overlay layer to FrameView:', props.frameOverlayLayer);
      layers.push(props.frameOverlayLayer);
    }
    
    return layers;
  }

  /**
   * FrameView should follow the DetailView's view state for proper positioning.
   */
  filterViewState({ viewState, currentViewState }: any) {
    // Follow DetailView's view state for proper overlay positioning
    if (viewState.id === DETAIL_VIEW_ID) {
      return { ...viewState, id: this.id };
    }
    
    // Handle overview clicks for frame positioning
    if (viewState.id === OVERVIEW_VIEW_ID) {
      const { target } = viewState;
      if (target) {
        return { ...currentViewState, target, id: this.id };
      }
    }
    
    return super.filterViewState({ viewState, currentViewState });
  }
}
