export type FrameState = {
  center: [number, number];
  size: [number, number];
};

export type FrameStateContextType = {
  // Current frame state
  frameCenter: [number, number];
  frameSize: [number, number];
  
  // Setters for frame state
  setFrameCenter: (center: [number, number]) => void;
  setFrameSize: (size: [number, number]) => void;
  
  // Convenience methods
  getFrameState: () => FrameState;
  updateFrameState: (center: [number, number], size: [number, number]) => void;
  
  // Frame bounds helpers
  getFrameBounds: () => {
    left: number;
    right: number;
    top: number;
    bottom: number;
  };
};