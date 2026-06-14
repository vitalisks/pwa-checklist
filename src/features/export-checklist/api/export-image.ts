import html2canvas from 'html2canvas'

export type ImageFormat = 'png' | 'jpeg'

const MIME_TYPES: Record<ImageFormat, string> = {
  png: 'image/png',
  jpeg: 'image/jpeg',
}

const EXTENSIONS: Record<ImageFormat, string> = {
  png: '.png',
  jpeg: '.jpg',
}

export async function renderChecklistToImage(
  element: HTMLElement,
  format: ImageFormat = 'png',
): Promise<Blob> {
  const canvas = await html2canvas(element, {
    scale: 2,
    useCORS: true,
    allowTaint: false,
    backgroundColor: '#f4f1ea',
    logging: false,
  })
  const mimeType = MIME_TYPES[format]
  const quality = format === 'jpeg' ? 0.92 : 1
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(blob => {
      if (blob) resolve(blob)
      else reject(new Error('Canvas toBlob returned null'))
    }, mimeType, quality)
  })
}

export async function downloadBlob(blob: Blob, filename: string): Promise<void> {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

export async function shareBlob(blob: Blob, title: string, format: ImageFormat = 'png'): Promise<boolean> {
  if (!navigator.share) return false
  try {
    const ext = EXTENSIONS[format]
    const mimeType = MIME_TYPES[format]
    const file = new File([blob], `${sanitizeFilename(title)}${ext}`, { type: mimeType })
    await navigator.share({
      title: title,
      files: [file],
    })
    return true
  } catch {
    return false
  }
}

export function sanitizeFilename(title: string): string {
  return title
    .replace(/[<>:"/\\|?*]/g, '')
    .replace(/\s+/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '')
    .slice(0, 100) || 'checklist'
}
