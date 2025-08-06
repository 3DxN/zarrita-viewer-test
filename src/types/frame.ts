/**
 * Frame state types for spatial frame management
 */

export type FrameState = {
  center: [number, number];
  size: [number, number];
};

export interface FrameInteractionState {
  isActive: boolean;
  dragStart: [number, number] | null;
  currentPosition: [number, number] | null;
}
