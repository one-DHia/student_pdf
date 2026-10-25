import * as pdfjsLib from 'pdfjs-dist';
import { PDFDocument, degrees } from 'pdf-lib';

// Configure worker URL for PDF.js in browser environment
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version || '4.0.379'}/pdf.worker.min.mjs`;

/**
 * Load PDF file bytes into pdf-lib PDFDocument
 */
export async function loadPdfDocument(file) {
  const arrayBuffer = await file.arrayBuffer();
  return await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
}

/**
 * Render all page thumbnails of a PDF file as Data URLs for interactive preview grid
 */
export async function getPdfThumbnails(file, maxPages = 100, password = '') {
  const arrayBuffer = await file.arrayBuffer();
  const options = { data: arrayBuffer };
  if (password) options.password = password;
  
  const loadingTask = pdfjsLib.getDocument(options);
  const pdf = await loadingTask.promise;
  const numPages = Math.min(pdf.numPages, maxPages);
  
  const thumbnails = [];
  
  for (let i = 1; i <= numPages; i++) {
    const page = await pdf.getPage(i);
    const viewport = page.getViewport({ scale: 0.4 }); // Thumbnail scale
    
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    canvas.height = viewport.height;
    canvas.width = viewport.width;
    
    await page.render({
      canvasContext: context,
      viewport: viewport
    }).promise;
    
    thumbnails.push({
      pageIndex: i - 1,
      pageNumber: i,
      dataUrl: canvas.toDataURL('image/jpeg', 0.8),
      rotation: 0,
      width: viewport.width,
      height: viewport.height
    });
  }
  
  return { numPages: pdf.numPages, thumbnails };
}

/**
 * Convert PDF pages to high-resolution JPEG or PNG images with password support
 */
export async function renderPdfPagesToImages(file, format = 'image/png', scale = 2.0, password = '', quality = 0.92) {
  const arrayBuffer = await file.arrayBuffer();
  const options = { data: arrayBuffer };
  if (password) options.password = password;
  
  const loadingTask = pdfjsLib.getDocument(options);
  const pdf = await loadingTask.promise;
  
  const images = [];
  
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const viewport = page.getViewport({ scale: scale });
    
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    canvas.height = viewport.height;
    canvas.width = viewport.width;
    
    await page.render({
      canvasContext: context,
      viewport: viewport
    }).promise;
    
    const blob = await new Promise((resolve, reject) => {
      canvas.toBlob(blob => blob ? resolve(blob) : reject(new Error(`Impossible de générer l’image de la page ${i}.`)), format, quality);
    });
    images.push({
      pageNumber: i,
      blob: blob,
      width: viewport.width,
      height: viewport.height,
      name: `${file.name.replace(/\.pdf$/i, '')}_page_${i}.${format === 'image/jpeg' ? 'jpg' : 'png'}`
    });
  }
  
  return images;
}

/**
 * Format bytes into human readable size string
 */
export function formatBytes(bytes, decimals = 2) {
  if (!bytes || bytes === 0) return '0 Octets';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Octets', 'Ko', 'Mo', 'Go', 'To'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}
