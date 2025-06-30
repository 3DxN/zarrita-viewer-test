import React, { FC, useState, useEffect } from 'react';
import { VolumeViewer, loadOmeZarr } from '@hms-dbmi/viv';

// Define the types for the props our component will accept.
interface MacroViewerProps {
  height: number;
  width: number;
}

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
        const loader = await loadOmeZarr('https://uk1s3.embassy.ebi.ac.uk/idr/zarr/v0.4/idr0048A/9846151.zarr/0', { type: 'multiscales' });
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
          {/*For some goddamn reason I'm getting the "Unsupported texture format 33326 Error: Unsupported texture format 33326" bug*/}
          <VolumeViewer
            contrastLimits={[[0, 1000], [0, 1000]]} // Example contrast limits
            colors={[[0, 0, 255], [0, 0, 0]]}
            channelsVisible={[true, true]} // Example channel, can be dynamic
            selections={[{}]} // Example selections
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