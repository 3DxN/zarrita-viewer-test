import * as zarr from "zarrita";

const url = "http://localhost:5500/test_prostate_s1+crop_v3_fix.ome.zarr"

async function main() {
    const store = new zarr.FetchStore(url);
    const root = zarr.root(store);
    
    // Try to open as array first
    const arr = await zarr.open(root.resolve('0/0'), { kind: "array" });
    console.log(`Opened array: dtype=${arr.dtype}, shape=[${arr.shape}]`);
    
    // Read a small chunk
    const zeroIndex = Array(arr.shape.length).fill(0);
    const chunk = await arr.getChunk(zeroIndex);
    console.log(`Chunk data:`, chunk.data.slice(0, 10)); // First 10 values
}

main().catch(console.error);