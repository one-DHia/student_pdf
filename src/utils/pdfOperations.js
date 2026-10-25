import { PDFDocument, rgb, degrees, StandardFonts } from 'pdf-lib';
import { encryptPDF } from '@pdfsmaller/pdf-encrypt';
import Tesseract from 'tesseract.js';
import JSZip from 'jszip';
import saveAs from 'file-saver';
import * as pdfjsLib from 'pdfjs-dist';
import { loadPdfDocument, renderPdfPagesToImages } from './pdfHelper';

/**
 * 1. Merge multiple PDF files into a single PDF document
 */
export async function mergePdfs(files) {
  const mergedPdf = await PDFDocument.create();
  
  for (const file of files) {
    const pdf = await loadPdfDocument(file);
    const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
    copiedPages.forEach((page) => mergedPdf.addPage(page));
  }
  
  const mergedPdfBytes = await mergedPdf.save();
  return new Blob([mergedPdfBytes], { type: 'application/pdf' });
}

/**
 * 2. Split PDF by range string (e.g., "1-3, 5, 8-10") or extract all pages as separate PDFs
 */
export async function splitPdf(file, rangeString = '') {
  const sourcePdf = await loadPdfDocument(file);
  const totalPages = sourcePdf.getPageCount();
  
  // If range string is empty, split into individual single-page PDFs in a ZIP archive
  if (!rangeString.trim()) {
    const zip = new JSZip();
    const baseName = file.name.replace(/\.pdf$/i, '');
    
    for (let i = 0; i < totalPages; i++) {
      const newPdf = await PDFDocument.create();
      const [copiedPage] = await newPdf.copyPages(sourcePdf, [i]);
      newPdf.addPage(copiedPage);
      const pdfBytes = await newPdf.save();
      zip.file(`${baseName}_page_${i + 1}.pdf`, pdfBytes);
    }
    
    return await zip.generateAsync({ type: 'blob' });
  }
  
  // Parse ranges like "1-3, 5, 8-10"
  const pagesToKeep = new Set();
  const parts = rangeString.split(',');
  
  for (const part of parts) {
    const trimmed = part.trim();
    if (trimmed.includes('-')) {
      const [start, end] = trimmed.split('-').map(n => parseInt(n.trim(), 10));
      if (!isNaN(start) && !isNaN(end)) {
        for (let p = Math.max(1, start); p <= Math.min(totalPages, end); p++) {
          pagesToKeep.add(p - 1);
        }
      }
    } else {
      const p = parseInt(trimmed, 10);
      if (!isNaN(p) && p >= 1 && p <= totalPages) {
        pagesToKeep.add(p - 1);
      }
    }
  }
  
  const indices = Array.from(pagesToKeep).sort((a, b) => a - b);
  if (indices.length === 0) {
    throw new Error('Aucune page valide sélectionnée pour la division.');
  }
  
  const extractedPdf = await PDFDocument.create();
  const copiedPages = await extractedPdf.copyPages(sourcePdf, indices);
  copiedPages.forEach(p => extractedPdf.addPage(p));
  
  const pdfBytes = await extractedPdf.save();
  return new Blob([pdfBytes], { type: 'application/pdf' });
}

/**
 * 3. Reorder, rotate, and delete pages from PDF
 */
export async function processPageOrderAndRotation(file, pageItems) {
  const sourcePdf = await loadPdfDocument(file);
  const newPdf = await PDFDocument.create();
  
  for (const item of pageItems) {
    const [page] = await newPdf.copyPages(sourcePdf, [item.pageIndex]);
    if (item.rotation) {
      const currentRotation = page.getRotation().angle;
      page.setRotation(degrees((currentRotation + item.rotation) % 360));
    }
    newPdf.addPage(page);
  }
  
  const pdfBytes = await newPdf.save();
  return new Blob([pdfBytes], { type: 'application/pdf' });
}

/**
 * 4. Compress PDF by re-sampling images to JPEG with adjustable compression quality & target max MB
 */
export async function compressPdf(file, quality = 0.5, targetSizeMb = null) {
  const normalizedQuality = Math.max(0.1, Math.min(1, Number(quality) || 0.5));
  let scale = 1.5;
  let jpegQuality = 0.82;
  if (normalizedQuality < 0.4) { scale = 1.0; jpegQuality = 0.62; }
  if (normalizedQuality < 0.2) { scale = 0.8; jpegQuality = 0.42; }

  // If target MB limit is specified
  if (targetSizeMb && parseFloat(targetSizeMb) > 0) {
    const targetBytes = parseFloat(targetSizeMb) * 1024 * 1024;
    // Adapt scale based on file size vs target size ratio
    if (file.size > targetBytes) {
      const ratio = targetBytes / file.size;
      scale = Math.max(0.6, Math.min(scale, scale * Math.sqrt(ratio)));
      jpegQuality = Math.max(0.25, Math.min(jpegQuality, jpegQuality * Math.sqrt(ratio)));
    }
  }

  const images = await renderPdfPagesToImages(file, 'image/jpeg', scale, '', jpegQuality);
  const newPdf = await PDFDocument.create();
  
  for (const img of images) {
    const imgBytes = await img.blob.arrayBuffer();
    const embeddedImage = await newPdf.embedJpg(imgBytes);
    const pageWidth = img.width / scale;
    const pageHeight = img.height / scale;
    const page = newPdf.addPage([pageWidth, pageHeight]);
    page.drawImage(embeddedImage, {
      x: 0,
      y: 0,
      width: pageWidth,
      height: pageHeight,
    });
  }
  
  const pdfBytes = await newPdf.save({ useObjectStreams: true });
  const resultBlob = new Blob([pdfBytes], { type: 'application/pdf' });
  return resultBlob;
}

/**
 * 5. Repair corrupted PDF by reconstructing page objects & resaving
 */
export async function repairPdf(file) {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const pdfDoc = await PDFDocument.load(arrayBuffer, { 
      ignoreEncryption: true,
      updateMetadata: false 
    });
    
    const newPdf = await PDFDocument.create();
    const pageCount = pdfDoc.getPageCount();
    
    for (let i = 0; i < pageCount; i++) {
      try {
        const [copiedPage] = await newPdf.copyPages(pdfDoc, [i]);
        newPdf.addPage(copiedPage);
      } catch (err) {
        console.warn(`Saut de la page ${i + 1} corrompue:`, err);
      }
    }
    
    const bytes = await newPdf.save({ useObjectStreams: false });
    return new Blob([bytes], { type: 'application/pdf' });
  } catch (err) {
    throw new Error('Échec de réparation : le fichier est gravement endommagé.');
  }
}

/**
 * 6. Add Text or Image Watermark to PDF
 */
export async function addWatermark(file, options) {
  const { text = 'CONFIDENTIEL', fontSize = 48, opacity = 0.3, colorHex = '#6366f1', rotationDeg = 45 } = options;
  const pdfDoc = await loadPdfDocument(file);
  const font = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const pages = pdfDoc.getPages();
  
  const r = parseInt(colorHex.slice(1, 3), 16) / 255 || 0.38;
  const g = parseInt(colorHex.slice(3, 5), 16) / 255 || 0.40;
  const b = parseInt(colorHex.slice(5, 7), 16) / 255 || 0.94;
  
  for (const page of pages) {
    const { width, height } = page.getSize();
    const textWidth = font.widthOfTextAtSize(text, fontSize);
    const textHeight = font.heightAtSize(fontSize);
    
    page.drawText(text, {
      x: (width - textWidth) / 2,
      y: (height - textHeight) / 2,
      size: fontSize,
      font: font,
      color: rgb(r, g, b),
      opacity: parseFloat(opacity),
      rotate: degrees(rotationDeg),
    });
  }
  
  const bytes = await pdfDoc.save();
  return new Blob([bytes], { type: 'application/pdf' });
}

/**
 * 7. Apply E-Signature image onto PDF page
 */
export async function addSignatureToPdf(file, signatureDataUrl, pageNumber = 1, xPercent = 0.5, yPercent = 0.2) {
  const pdfDoc = await loadPdfDocument(file);
  const pages = pdfDoc.getPages();
  const targetPage = pages[Math.min(pageNumber - 1, pages.length - 1)];
  
  const pngImage = await pdfDoc.embedPng(signatureDataUrl);
  const { width, height } = targetPage.getSize();
  
  const sigWidth = Math.min(200, width * 0.35);
  const sigHeight = (pngImage.height / pngImage.width) * sigWidth;
  
  const posX = width * xPercent - sigWidth / 2;
  const posY = height * yPercent - sigHeight / 2;
  
  targetPage.drawImage(pngImage, {
    x: Math.max(10, posX),
    y: Math.max(10, posY),
    width: sigWidth,
    height: sigHeight,
  });
  
  const bytes = await pdfDoc.save();
  return new Blob([bytes], { type: 'application/pdf' });
}

/**
 * 8. Perform OCR using Tesseract.js
 */
export async function performOcrOnPdfOrImage(file, lang = 'fra', onProgress = () => {}) {
  const isPdf = file.type === 'application/pdf' || /\.pdf$/i.test(file.name);
  const images = isPdf ? await renderPdfPagesToImages(file, 'image/png', 2.0) : [{ pageNumber: 1, blob: file }];
  if (images.length === 0) throw new Error('Aucune page n’a pu être lue.');
  let activeIndex = 0;

  const worker = await Tesseract.createWorker(lang, 1, {
    logger: m => {
      if (m.status === 'recognizing text') {
        onProgress(Math.round(((activeIndex + m.progress) / images.length) * 100));
      }
    }
  });
  const results = [];
  try {
    for (const [index, image] of images.entries()) {
      activeIndex = index;
      const result = await worker.recognize(image.blob);
      results.push({ pageNumber: image.pageNumber, text: result.data.text, confidence: result.data.confidence });
    }
  } finally {
    await worker.terminate();
  }
  onProgress(100);
  const text = results.map(result => (isPdf ? `--- Page ${result.pageNumber} ---\n` : '') + result.text).join('\n\n');
  const confidence = Math.round(results.reduce((sum, result) => sum + result.confidence, 0) / results.length);
  return { text, confidence, pagesProcessed: results.length };
}

/**
 * 9. Protect PDF with User Password Encryption
 */
export async function protectPdf(file, password) {
  if (!password || !password.trim()) {
    throw new Error('Veuillez entrer un mot de passe pour protéger le fichier.');
  }
  const arrayBuffer = await file.arrayBuffer();
  const fileBytes = new Uint8Array(arrayBuffer);
  
  // Apply real AES-256 PDF encryption
  const encryptedBytes = await encryptPDF(fileBytes, password.trim());
  return new Blob([encryptedBytes], { type: 'application/pdf' });
}

/**
 * 10. Unlock PDF by Removing Password Protection
 */
export async function unlockPdf(file, password = '') {
  const cleanPassword = password ? password.trim() : '';
  const arrayBuffer = await file.arrayBuffer();
  
  // 1. Verify password using PDF.js
  try {
    const loadingTask = pdfjsLib.getDocument({
      data: new Uint8Array(arrayBuffer),
      password: cleanPassword
    });
    await loadingTask.promise;
  } catch (err) {
    console.error('Password verification error:', err);
    throw new Error('Mot de passe incorrect ou manquant. Saisissez le mot de passe exact pour déverrouiller ce document.');
  }

  // 2. Render decrypted pages and rebuild unencrypted PDF
  try {
    const renderedImages = await renderPdfPagesToImages(file, 'image/png', 2.0, cleanPassword);
    const unlockedPdf = await PDFDocument.create();

    for (const img of renderedImages) {
      const imgBytes = await img.blob.arrayBuffer();
      const embeddedImg = await unlockedPdf.embedPng(imgBytes);
      const page = unlockedPdf.addPage([embeddedImg.width / 2, embeddedImg.height / 2]);
      page.drawImage(embeddedImg, {
        x: 0,
        y: 0,
        width: embeddedImg.width / 2,
        height: embeddedImg.height / 2
      });
    }

    const pdfBytes = await unlockedPdf.save({ useObjectStreams: false });
    return new Blob([pdfBytes], { type: 'application/pdf' });
  } catch (err) {
    console.error('Error rebuilding unlocked PDF:', err);
    throw new Error('Échec du déverrouillage du fichier PDF.');
  }
}

/**
 * 11. Add Automatic Page Numbers to PDF
 */
export async function addPageNumbersToPdf(file, formatPattern = 'Page {page} sur {total}', position = 'bottom-center') {
  const pdfDoc = await loadPdfDocument(file);
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const pages = pdfDoc.getPages();
  const totalPages = pages.length;
  const fontSize = 10;
  
  for (let i = 0; i < totalPages; i++) {
    const page = pages[i];
    const { width, height } = page.getSize();
    
    const pageNumText = formatPattern
      .replace('{page}', String(i + 1))
      .replace('{total}', String(totalPages));
      
    const textWidth = font.widthOfTextAtSize(pageNumText, fontSize);
    
    let x = (width - textWidth) / 2; // default center
    let y = 25; // default bottom
    
    if (position === 'bottom-right') {
      x = width - textWidth - 30;
      y = 25;
    } else if (position === 'top-right') {
      x = width - textWidth - 30;
      y = height - 30;
    }
    
    page.drawText(pageNumText, {
      x,
      y,
      size: fontSize,
      font: font,
      color: rgb(0.3, 0.3, 0.3)
    });
  }
  
  const bytes = await pdfDoc.save();
  return new Blob([bytes], { type: 'application/pdf' });
}

/**
 * 12. Export PDF Text to Markdown (.md) for Notion / Obsidian / Anki
 */
export async function pdfToMarkdown(file) {
  const arrayBuffer = await file.arrayBuffer();
  const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
  const pdf = await loadingTask.promise;
  
  let mdLines = [];
  mdLines.push(`# ${file.name.replace(/\.pdf$/i, '')}`);
  mdLines.push(`> *Converti en Markdown avec StudentPDF - ${new Date().toLocaleDateString('fr-FR')}*\n`);
  
  for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
    const page = await pdf.getPage(pageNum);
    const textContent = await page.getTextContent();
    
    mdLines.push(`## Page ${pageNum}\n`);
    
    let lastY = null;
    let currentParagraph = [];
    
    for (const item of textContent.items) {
      const y = Math.round(item.transform[5]);
      
      if (lastY !== null && Math.abs(y - lastY) > 8) {
        if (currentParagraph.length > 0) {
          const text = currentParagraph.join(' ').trim();
          // Detect headers if all caps or short title
          if (text.length < 50 && text.toUpperCase() === text && text.length > 3) {
            mdLines.push(`### ${text}\n`);
          } else {
            mdLines.push(`${text}\n`);
          }
          currentParagraph = [];
        }
      }
      
      if (item.str.trim()) {
        currentParagraph.push(item.str);
      }
      lastY = y;
    }
    
    if (currentParagraph.length > 0) {
      mdLines.push(`${currentParagraph.join(' ').trim()}\n`);
    }
    
    mdLines.push(`---\n`);
  }
  
  const fullMdText = mdLines.join('\n');
  return {
    blob: new Blob([fullMdText], { type: 'text/markdown;charset=utf-8' }),
    text: fullMdText
  };
}
