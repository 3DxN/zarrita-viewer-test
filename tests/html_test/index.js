const zarrita = await import('https://cdn.jsdelivr.net/npm/zarrita@0.5.1/+esm');
import { detectNodeType, displayNodeInfo } from './zarr-utils.js';

let currentStore = null;
let currentArray = null;
let currentChannel = 0;

async function loadZarr() {
    const url = document.getElementById('zarrUrl').value;
    const infoDiv = document.getElementById('info');
    const errorDiv = document.getElementById('error');
    const loadingDiv = document.getElementById('loading');
    
    // Clear previous results
    errorDiv.style.display = 'none';
    infoDiv.style.display = 'none';
    loadingDiv.style.display = 'block';
    
    try {
        currentStore = new zarrita.FetchStore(url);
        
        // Get detailed node information
        const nodeInfoText = await displayNodeInfo(zarrita, currentStore, '');
        
        let infoText = `Loaded Zarr store: ${url}\n\n`;
        infoText += nodeInfoText;
        
        infoDiv.textContent = infoText;
        infoDiv.style.display = 'block';
        loadingDiv.style.display = 'none';
        
    } catch (error) {
        errorDiv.textContent = `Error loading Zarr: ${error.message}`;
        errorDiv.style.display = 'block';
        loadingDiv.style.display = 'none';
    }
};

async function loadImage() {
    if (!currentStore) {
        alert('Please load a Zarr store first');
        return;
    }

    const path = document.getElementById('zarrPath').value;
    const infoDiv = document.getElementById('info');
    const errorDiv = document.getElementById('error');
    const loadingDiv = document.getElementById('loading');
    const canvas = document.getElementById('imageCanvas');
    
    errorDiv.style.display = 'none';
    loadingDiv.style.display = 'block';
    canvas.style.display = 'none';
    
    try {
        // Detect what type of node this path points to
        const nodeInfo = await detectNodeType(zarrita, currentStore, path);
        
        // Try to open as array using root.resolve like in loading_test
        const root = zarrita.root(currentStore);
        const arr = await zarrita.open(root.resolve(path), { kind: nodeInfo.version === 'v2' ? 'v2_array' : 'array' });
        currentArray = arr;
        
        let infoText = `Array Info:\n`;
        infoText += `Path: ${path}\n`;
        infoText += `Node type: ${nodeInfo.type}\n`;
        infoText += `Zarr version: ${nodeInfo.version}\n`;
        infoText += `Shape: [${arr.shape}]\n`;
        infoText += `Dtype: ${arr.dtype}\n`;
        infoText += `Chunks: [${arr.chunks}]\n`;
        
        // Setup navigation controls
        setupNavigationControls(arr);
        
        infoDiv.textContent = infoText;
        infoDiv.style.display = 'block';

        // Load the initial image
        await updateImageData();
        loadingDiv.style.display = 'none';
        
    } catch (error) {
        // If it's not an array, show node information
        try {
            const nodeInfoText = await displayNodeInfo(zarrita, currentStore, path, true);
            infoDiv.textContent = nodeInfoText;
        } catch (e) {
            errorDiv.textContent = `Error loading path "${path}": ${error.message}`;
            errorDiv.style.display = 'block';
        }
        loadingDiv.style.display = 'none';
    }
};

// Make functions globally available
window.loadZarr = loadZarr;
window.loadImage = loadImage;
window.updateImage = updateImage;
window.selectChannel = selectChannel;

function setupNavigationControls(arr) {
    const navControls = document.getElementById('navigationControls');
    const channelButtons = document.getElementById('channelButtons');
    
    // Clear existing channel buttons
    channelButtons.innerHTML = '';
    
    // Determine number of channels based on array shape
    // For 5D arrays [t, c, z, y, x], channels are at index 1
    // For 4D arrays [c, z, y, x], channels are at index 0
    // For 3D arrays [z, y, x], no channels
    let numChannels = 1;
    let channelDim = -1;
    
    if (arr.shape.length >= 4) {
        // Assume channel dimension is the one that's typically small (< 10)
        for (let i = 0; i < arr.shape.length - 2; i++) {
            if (arr.shape[i] <= 10) {
                numChannels = arr.shape[i];
                channelDim = i;
                break;
            }
        }
    }
    
    // Create channel buttons
    for (let i = 0; i < numChannels; i++) {
        const btn = document.createElement('button');
        btn.textContent = `Ch ${i}`;
        btn.className = 'channel-btn' + (i === 0 ? ' active' : '');
        btn.onclick = () => selectChannel(i);
        channelButtons.appendChild(btn);
    }
    
    // Setup scroll controls
    const xOffset = document.getElementById('xOffset');
    const yOffset = document.getElementById('yOffset');
    const zSlice = document.getElementById('zSlice');
    const timeSlice = document.getElementById('timeSlice');
    
    // Set max values based on array shape
    const width = arr.shape[arr.shape.length - 1];
    const height = arr.shape[arr.shape.length - 2];
    
    xOffset.max = Math.max(0, width - 256);
    yOffset.max = Math.max(0, height - 256);
    
    // Set initial range displays
    document.getElementById('xOffsetValue').textContent = `(0-255)/${width}`;
    document.getElementById('yOffsetValue').textContent = `(0-255)/${height}`;
    
    // Set Z and Time slices if they exist
    if (arr.shape.length >= 3) {
        const zDim = arr.shape.length - 3;
        const zSize = arr.shape[zDim];
        zSlice.max = Math.max(0, zSize - 1);
        document.getElementById('zSliceValue').textContent = `/${zSize-1}`;
    }
    
    if (arr.shape.length >= 4) {
        // For 5D arrays, time is typically at index 0
        // For 4D arrays, if no channels detected, time might be at index 0
        let timeDim = 0;
        
        if (arr.shape.length === 5) {
            // Standard OME-Zarr: [t, c, z, y, x]
            timeDim = 0;
        } else if (arr.shape.length === 4) {
            // Could be [t, z, y, x] or [c, z, y, x]
            // If we found channels, time is at 0, otherwise channels are at 0
            timeDim = channelDim === -1 ? 0 : (channelDim === 0 ? 1 : 0);
        }
        
        // Make sure we don't go out of bounds and the dimension exists
        if (timeDim < arr.shape.length) {
            const timeSize = arr.shape[timeDim];
            timeSlice.max = Math.max(0, timeSize - 1);
            document.getElementById('timeSliceValue').textContent = `0/${timeSize-1}`;
        } else {
            timeSlice.max = 0;
            document.getElementById('timeSliceValue').textContent = `0/0`;
            console.log(`No time dimension found, setting max to 0`);
        }
    }
    
    // Show navigation controls
    navControls.style.display = 'block';
}

function selectChannel(channelIndex) {
    currentChannel = channelIndex;
    
    // Update button states
    const buttons = document.querySelectorAll('.channel-btn');
    buttons.forEach((btn, index) => {
        btn.classList.toggle('active', index === channelIndex);
    });
    
    updateImage();
}

async function updateImage() {
    if (!currentArray) return;
    
    const canvas = document.getElementById('imageCanvas');
    const errorDiv = document.getElementById('error');
    
    try {
        errorDiv.style.display = 'none';
        
        await updateImageData();
        
    } catch (error) {
        console.error(error);
        errorDiv.textContent = `Error updating image: ${error.message}`;
        errorDiv.style.display = 'block';
        loadingDiv.style.display = 'none';
    }
}

async function updateImageData() {
    const canvas = document.getElementById('imageCanvas');
    const infoDiv = document.getElementById('info');
    
    // Get current control values
    const xOffset = parseInt(document.getElementById('xOffset').value);
    const yOffset = parseInt(document.getElementById('yOffset').value);
    const zSlice = parseInt(document.getElementById('zSlice').value);
    const timeSlice = parseInt(document.getElementById('timeSlice').value);
    
    // Update value displays and ranges
    const array = currentArray;
    const width = array.shape[array.shape.length - 1];
    const height = array.shape[array.shape.length - 2];
    
    // CLAMP VALUES BEFORE USING THEM
    const clampedTimeSlice = Math.min(timeSlice, array.shape[0] - 1);
    const clampedChannel = Math.min(currentChannel, array.shape[1] - 1);
    const clampedZSlice = Math.min(zSlice, array.shape[array.shape.length - 3] - 1);
    const clampedXOffset = Math.min(xOffset, width - 1);
    const clampedYOffset = Math.min(yOffset, height - 1);
    
    // Update range displays
    const xEnd = Math.min(clampedXOffset + 256, width);
    const yEnd = Math.min(clampedYOffset + 256, height);
    document.getElementById('xOffsetValue').textContent = `(${clampedXOffset}-${xEnd})/${width}`;
    document.getElementById('yOffsetValue').textContent = `(${clampedYOffset}-${yEnd})/${height}`;
    
    if (array.shape.length >= 3) {
        const zSize = array.shape[array.shape.length - 3];
        document.getElementById('zSliceValue').textContent = `${clampedZSlice}/${zSize-1}`;
    }
    
    if (array.shape.length >= 4) {
        const timeSize = array.shape[0];
        document.getElementById('timeSliceValue').textContent = `${clampedTimeSlice}/${timeSize-1}`;
    }
    
    // Create selection using CLAMPED values
    const arr = currentArray;
    const selection = [];
    
    // Handle different array shapes
    if (arr.shape.length === 5) {
        // [t, c, z, y, x]
        selection.push(clampedTimeSlice);
        selection.push(clampedChannel);
        selection.push(clampedZSlice);
        selection.push(zarrita.slice(clampedYOffset, Math.min(clampedYOffset + 256, height)));
        selection.push(zarrita.slice(clampedXOffset, Math.min(clampedXOffset + 256, width)));
    } else if (arr.shape.length === 4) {
        // [c, z, y, x] or [t, z, y, x]
        selection.push(clampedChannel);
        selection.push(clampedZSlice);
        selection.push(zarrita.slice(clampedYOffset, Math.min(clampedYOffset + 256, height)));
        selection.push(zarrita.slice(clampedXOffset, Math.min(clampedXOffset + 256, width)));
    } else if (arr.shape.length === 3) {
        // [z, y, x]
        selection.push(clampedZSlice);
        selection.push(zarrita.slice(clampedYOffset, Math.min(clampedYOffset + 256, height)));
        selection.push(zarrita.slice(clampedXOffset, Math.min(clampedXOffset + 256, width)));
    } else {
        // [y, x]
        selection.push(zarrita.slice(clampedYOffset, Math.min(clampedYOffset + 256, height)));
        selection.push(zarrita.slice(clampedXOffset, Math.min(clampedXOffset + 256, width)));
    }
    
    console.log('Array shape:', arr.shape);
    console.log('Selection:', selection);
    
    // Get the image data
    const imageData = await zarrita.get(arr, selection);
    
    // Render to canvas
    renderImageToCanvas(imageData, canvas);
    canvas.style.display = 'block';
}

function renderImageToCanvas(imageData, canvas) {
    const { data, shape } = imageData;
    
    // Handle different dimensionalities
    let height, width;
    if (shape.length >= 2) {
        height = shape[shape.length - 2];
        width = shape[shape.length - 1];
    } else {
        // 1D data - make it a square-ish image
        const totalPixels = shape[0];
        width = Math.ceil(Math.sqrt(totalPixels));
        height = Math.ceil(totalPixels / width);
    }
    
    canvas.width = width;
    canvas.height = height;
    
    const ctx = canvas.getContext('2d');
    const imageDataCanvas = ctx.createImageData(width, height);
    
    // Normalize data to 0-255 range
    const min = Math.min(...data);
    const max = Math.max(...data);
    const range = max - min || 1;
    
    // Convert to grayscale RGBA
    for (let i = 0; i < data.length && i < width * height; i++) {
        const normalized = Math.floor(((data[i] - min) / range) * 255);
        const pixelIndex = i * 4;
        
        imageDataCanvas.data[pixelIndex] = normalized;     // R
        imageDataCanvas.data[pixelIndex + 1] = normalized; // G
        imageDataCanvas.data[pixelIndex + 2] = normalized; // B
        imageDataCanvas.data[pixelIndex + 3] = 255;        // A
    }
    
    ctx.putImageData(imageDataCanvas, 0, 0);
}