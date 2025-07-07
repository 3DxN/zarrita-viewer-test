import { VivView, DETAIL_VIEW_ID, OVERVIEW_VIEW_ID } from '@hms-dbmi/viv'
import { OrthographicView } from '@deck.gl/core'
import type { Layer } from '@deck.gl/core'

export const FRAME_VIEW_ID = 'frame';

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
