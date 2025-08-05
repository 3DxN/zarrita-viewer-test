import React, { createContext, useContext, useState, useCallback } from 'react';

import type { FrameState, FrameStateContextType } from '../types/frame';


const FrameStateContext = createContext<FrameStateContextType | undefined>(undefined);

export const FrameStateProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [frameCenter, setFrameCenter] = useState<[number, number]>([500, 500]);
  const [frameSize, setFrameSize] = useState<[number, number]>([400, 400]);

  const getFrameState = useCallback((): FrameState => ({
    center: [...frameCenter],
    size: [...frameSize],
  }), [frameCenter, frameSize]);

  const updateFrameState = useCallback((center: [number, number], size: [number, number]) => {
    setFrameCenter(center);
    setFrameSize(size);
  }, []);

  const getFrameBounds = useCallback(() => {
    const [centerX, centerY] = frameCenter;
    const [width, height] = frameSize;
    const halfWidth = width / 2;
    const halfHeight = height / 2;

    return {
      left: centerX - halfWidth,
      right: centerX + halfWidth,
      top: centerY - halfHeight,
      bottom: centerY + halfHeight,
    };
  }, [frameCenter, frameSize]);

  const contextValue: FrameStateContextType = {
    frameCenter,
    frameSize,
    setFrameCenter,
    setFrameSize,
    getFrameState,
    updateFrameState,
    getFrameBounds,
  };

  return (
    <FrameStateContext.Provider value={contextValue}>
      {children}
    </FrameStateContext.Provider>
  );
};

export const useFrameState = (): FrameStateContextType => {
  const context = useContext(FrameStateContext);
  if (!context) {
    throw new Error('useFrameState must be used within a FrameStateProvider');
  }
  return context;
};
