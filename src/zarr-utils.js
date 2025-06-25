// Zarr utility functions for node type detection and exploration

export async function detectZarrVersion(store, path = '') {
    try {
        // Check for v3 first (zarr.json)
        const v3Url = `${store.url}/${path ? path + '/' : ''}zarr.json`;
        const v3Response = await fetch(v3Url);
        if (v3Response.ok) {
            return 'v3';
        }
        
        // Check for v2 (.zarray or .zgroup)
        const arrayUrl = `${store.url}${path ? path + '/' : ''}.zarray`;
        const groupUrl = `${store.url}${path ? path + '/' : ''}.zgroup`;
        
        const [arrayResponse, groupResponse] = await Promise.all([
            fetch(arrayUrl),
            fetch(groupUrl)
        ]);
        
        if (arrayResponse.ok || groupResponse.ok) {
            return 'v2';
        }
        
        return 'unknown';
    } catch (error) {
        console.warn(`Error detecting Zarr version for path "${path}":`, error);
        return 'unknown';
    }
}

export async function detectNodeType(zarrita, store, path) {
    try {
        const version = await detectZarrVersion(store, path);
        const kindPrefix = version === 'v2' ? 'v2_' : '';
        const root = zarrita.root(store);
        const node = path ? root.resolve(path) : root;

        // Try opening as array first
        try {
            await zarrita.open(node, { kind: `${kindPrefix}array` });
            return { version, type: 'array' };
        } catch {
            // If array fails, try group
            try {
                await zarrita.open(node, { kind: `${kindPrefix}group` });
                return { version, type: 'group' };
            } catch {
                return { version, type: 'unknown' };
            }
        }
    } catch (error) {
        console.error(`Error detecting node type at path "${path}":`, error);
        return { version: 'unknown', type: 'unknown' };
    }
}

export function explainOmeZarrStructure() {
    return `
OME-Zarr Structure Guide:
- Root level: Contains multiscale groups (0, 1, 2, ...)
- Resolution levels: 0 = highest resolution, 1+ = downsampled
- Array dimensions: [t, c, z, y, x] where:
- t = time points
- c = channels (fluorescence, brightfield, etc.)
- z = z-slices (depth)
- y, x = spatial dimensions
- Common paths to try:
- "0" = highest resolution group
- "0/0" = highest resolution array
- "0/c/0" = specific channel at highest resolution
- "1" = next resolution level (2x downsampled)
    `;
}

export async function displayNodeInfo(zarrita, store, path, isLoadingImage = false) {
    try {
        const nodeInfo = await detectNodeType(zarrita, store, path);
        
        let infoText = `Path: "${path || 'root'}"\n`;
        infoText += `Node type: ${nodeInfo.type}\n`;
        infoText += `Zarr version: ${nodeInfo.version}\n\n`;

        // Just return the basic store group info
        if (!isLoadingImage) {
            return infoText
        }
        
        // Otherwise we teach the user how to explore the path they want
        if (nodeInfo.type.includes('group')) {
            try {
                const root = zarrita.root(store);
                const node = path ? root.resolve(path) : root;
                const group = await zarrita.open(node, { kind: 'group' });
                const attrs = await group.attrs;
                
                infoText += `This is a group, not an array.\n`;
                infoText += `Group attributes: ${JSON.stringify(attrs, null, 2)}\n\n`;
                
                if (attrs && attrs.omero) {
                    infoText += `OME-Zarr detected with ${attrs.omero.channels?.length || 0} channels\n\n`;
                }
                
                infoText += explainOmeZarrStructure();
                
            } catch (e) {
                infoText += `Could not access group details: ${e.message}\n`;
            }
        } else if (nodeInfo.type.includes('array')) {
            infoText += `This is an array and can be loaded for viewing.\n`;
        } else {
            infoText += `Node type could not be determined. The path may not exist or be inaccessible.\n`;
            infoText += explainOmeZarrStructure();
        }
        
        return infoText;
        
    } catch (error) {
        return `Error analyzing path "${path}": ${error.message}\n` + explainOmeZarrStructure();
    }
}
