const MAX_WIDTH = 1024;
const JPEG_QUALITY = 0.7;

export function compressImage(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                let { width, height } = img;

                if (width > MAX_WIDTH) {
                    height = (height / width) * MAX_WIDTH;
                    width = MAX_WIDTH;
                }

                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                if (!ctx) {
                    reject(new Error('Failed to get canvas context'));
                    return;
                }
                ctx.drawImage(img, 0, 0, width, height);
                resolve(canvas.toDataURL('image/jpeg', JPEG_QUALITY));
            };
            img.onerror = () => reject(new Error('Failed to load image'));
            img.src = reader.result as string;
        };
        reader.onerror = () => reject(reader.error);
        reader.readAsDataURL(file);
    });
}