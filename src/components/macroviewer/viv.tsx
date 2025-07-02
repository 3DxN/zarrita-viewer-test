import React, { FC, useState, useEffect } from 'react';
import { VolumeViewer, loadOmeZarr } from '@hms-dbmi/viv';
import { MacroViewerProps } from '../../types/macroviewer';

/**
 * MacroViewer is the primary, interactive 3D view of the imaging data.
 * It uses VivViewer to render the volume and captures user interactions
 * to drive other components in the application.
 */
const MacroViewer: FC<MacroViewerProps> = ({
  height,
  width,
}) => {

  const [imgLoaded, setImgLoaded] = useState(false);
  const [src, setSrc] = useState<any>(null);

  useEffect(() => {
    // Load the OME-Zarr data when the component mounts
    const loadData = async () => {
      try {
        const loader = await loadOmeZarr('https://uk1s3.embassy.ebi.ac.uk/idr/zarr/v0.5/idr0026/3.66.9-6.141020_15-41-29.00.ome.zarr/0', { type: 'multiscales' });
        setSrc(loader.data);
        setImgLoaded(true);
        console.log('OME-Zarr data loaded successfully, data_type:', loader.data)
      } catch (error) {
        console.error('Error loading OME-Zarr data:', error);
      }
    };

    loadData();
  }, []);

  return (
    <>
      {imgLoaded ? (
        <div style={{ width: `${width}px`, height: `${height}px`, position: 'relative' }}>
          <VolumeViewer
            contrastLimits={[[0, 1023], [0, 1023]]} // Example contrast limits
            colors={[[0, 255, 0], [0, 0, 0]]}
            channelsVisible={[true, true]} // Example channel, can be dynamic
            selections={[{c: 0}]} // Example selections
            width={width}
            height={height}
            loader={src}
          />
        </div>
      ) : (
        <div style={{ width: `${width}px`, height: `${height}px`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          Loading...
        </div>
      )}
    </>
  );
};

export default MacroViewer;