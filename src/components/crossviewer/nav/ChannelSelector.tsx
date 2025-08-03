import React from 'react';
import { ChannelMapperProps, ChannelMapping } from '../../../types/crossviewer';


const ChannelSelector = (props: ChannelMapperProps) => {
  const { 
    channelNames,
    channelMap,
    onChannelChange: setChannelMapping
  } = props;

  // Handler for when a radio button is selected
  const handleDropdownChange = (role: keyof ChannelMapping, value: string) => {
    
    let selectedIndex: number | null;
    try {
      selectedIndex = parseInt(value, 10);
      if (isNaN(selectedIndex)) {
        selectedIndex = null; // If parsing fails, set to null
      }
    } catch (error) {
      selectedIndex = null;
    }

    setChannelMapping(role, selectedIndex);
  };

  const dropdownStyle: React.CSSProperties = {
    width: '100%',
    padding: '8px',
    borderRadius: '4px',
    border: '1px solid #ccc',
    fontSize: '14px',
  };
  
  return (
    <div style={{ 
      marginBottom: '20px', 
      padding: '15px', 
      border: '1px solid #ddd', 
      borderRadius: '5px', 
      backgroundColor: '#f9f9f9' 
    }}>
      <label style={{ display: 'block', marginBottom: '10px', fontSize: '14px', fontWeight: 'bold' }}>
        Channel Rendering Roles:
      </label>
      
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        {/* Nucleus Dropdown */}
        <div>
          <label style={{ display: 'block', marginBottom: '5px', fontSize: '12px', fontWeight: '500' }}>
            Nucleus
          </label>
          <select
            value={channelMap.nucleus === null ? 'null' : channelMap.nucleus}
            onChange={(e) => handleDropdownChange('nucleus', e.target.value)}
            style={dropdownStyle}
          >
            <option value="null">Select Channel</option>
            {channelNames.map((name, index) => (
              <option key={index} value={index}>
                {name}
              </option>
            ))}
          </select>
        </div>

        {/* Cytoplasm Dropdown */}
        <div>
          <label style={{ display: 'block', marginBottom: '5px', fontSize: '12px', fontWeight: '500' }}>
            Cytoplasm
          </label>
          <select
            value={channelMap.cytoplasm === null ? 'null' : channelMap.cytoplasm}
            onChange={(e) => handleDropdownChange('cytoplasm', e.target.value)}
            style={dropdownStyle}
          >
            <option value="null">Select Channel</option>
            {channelNames.map((name, index) => (
              <option key={index} value={index}>
                {name}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
};

export default ChannelSelector;