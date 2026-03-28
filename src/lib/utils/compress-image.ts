import imageCompression, { type Options } from 'browser-image-compression';

export async function compressEvidenceImage(file: File): Promise<File> {
    const options: Options = {
        maxSizeMB: 0.8,
        maxWidthOrHeight: 1280,
        useWebWorker: true,
        fileType: 'image/webp'
    };

    try {
        const compressedBlob = await imageCompression(file, options);
        // Convert Blob back to File instance for standard handling
        return new File(
            [compressedBlob],
            file.name.replace(/\.[^/.]+$/, "") + ".webp",
            { type: "image/webp" }
        );
    } catch (error) {
        console.error("Error compressing image:", error);
        throw error;
    }
}
