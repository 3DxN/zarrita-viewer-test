'use client';

import React from 'react';

import type { ChannelMapping, ContrastLimits, ContrastLimitsProps } from '../../../types/crossviewer';


/**
 * Navigator component that allows dynamic selection of contrast limits
 * per each selected channel defined in channelMap
 */
const ContrastLimitsSelector = ({
  contrastLimitsProps,
  channelMap,
}: {
  contrastLimitsProps: ContrastLimitsProps
  channelMap: ChannelMapping
}) => {
  const { contrastLimits, maxContrastLimit, onContrastLimitsChange } = contrastLimitsProps;

  return (
    <div>
      <h3>Contrast Limits</h3>
      {Object.entries(channelMap).map(([role, channelIndex]) => {
        if (channelIndex === null || channelIndex === undefined) {
          return null;
        }

        const currentLimit = contrastLimits[channelIndex] ?? 0;
        const maxLimit = maxContrastLimit

        console.log('Rendering contrast limits selector for role:', role, 'with index:', channelIndex);

        return (
          <div key={role} style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', marginBottom: '6px', fontWeight: 'bold' }}>
              {role}: {currentLimit}
            </label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontSize: '12px', color: '#888', minWidth: 24 }}>0</span>
              <input
                type="range"
                min={0}
                max={maxLimit}
                value={currentLimit}
                onChange={(e) => {
                  try {
                    const newLimit = parseInt(e.target.value, 10);
                    if (isNaN(newLimit)) {
                      return;
                    }
                    onContrastLimitsChange(
                      contrastLimits.map((limit, index) => 
                        index === channelIndex ? newLimit : limit
                      ) as ContrastLimits
                    );
                  } catch (error) {
                    console.error('Invalid contrast limit value:', e.target.value);
                    return;
                  }
                }}
                style={{ flex: 1 }}
              />
              <span style={{ fontSize: '12px', color: '#888', minWidth: 32 }}>{maxLimit}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default ContrastLimitsSelector;