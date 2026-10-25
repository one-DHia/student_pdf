import { PDFDocument, rgb, StandardFonts, PageSizes } from 'pdf-lib';
import mammoth from 'mammoth';
import * as XLSX from 'xlsx';
import JSZip from 'jszip';

/**
 * 1. Convert Images (JPG, PNG, WEBP) to PDF
 */
export async function imagesToPdf(imageFiles, pageSize = 'A4', margin = 20) {
  const pdfDoc = await PDFDocument.create();
  
  for (const file of imageFiles) {
    const arrayBuffer = await file.arrayBuffer();
    let embeddedImg;
    
    if (file.type === 'image/jpeg' || file.name.match(/\.(jpg|jpeg)$/i)) {
      embeddedImg = await pdfDoc.embedJpg(arrayBuffer);
    } else {
      // Default to PNG
      embeddedImg = await pdfDoc.embedPng(arrayBuffer);
    }
    
    const [pageWidth, pageHeight] = PageSizes[pageSize] || PageSizes.A4;
    const page = pdfDoc.addPage([pageWidth, pageHeight]);
    
    const maxWidth = pageWidth - margin * 2;
    const maxHeight = pageHeight - margin * 2;
    
    // Scale image maintaining aspect ratio
    const scale = Math.min(maxWidth / embeddedImg.width, maxHeight / embeddedImg.height, 1.0);
    const scaledWidth = embeddedImg.width * scale;
    const scaledHeight = embeddedImg.height * scale;
    
    // Center image on page
    const x = (pageWidth - scaledWidth) / 2;
    const y = (pageHeight - scaledHeight) / 2;
    
    page.drawImage(embeddedImg, {
      x,
      y,
      width: scaledWidth,
      height: scaledHeight,
    });
  }
  
  const bytes = await pdfDoc.save();
  return new Blob([bytes], { type: 'application/pdf' });
}

/**
 * 2. Convert Word (.docx) to PDF
 */
export async function wordToPdf(docxFile) {
  const arrayBuffer = await docxFile.arrayBuffer();
  // Extract text and html representation using mammoth
  const result = await mammoth.extractRawText({ arrayBuffer });
  const rawText = result.value || 'Document Word vide.';
  
  const pdfDoc = await PDFDocument.create();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  
  const lines = rawText.split('\n');
  let page = pdfDoc.addPage(PageSizes.A4);
  const { width, height } = page.getSize();
  const margin = 40;
  const fontSize = 11;
  const lineHeight = 16;
  let currentY = height - margin;
  
  // Title header
  page.drawText(docxFile.name.replace(/\.docx$/i, ''), {
    x: margin,
    y: currentY,
    size: 16,
    font: boldFont,
    color: rgb(0.1, 0.1, 0.2)
  });
  currentY -= 30;
  
  for (const rawLine of lines) {
    const trimmed = rawLine.trim();
    if (!trimmed) {
      currentY -= lineHeight / 2;
      continue;
    }
    
    // Simple line wrapping
    const maxCharsPerLine = Math.floor((width - margin * 2) / 6);
    const words = trimmed.split(' ');
    let currentLineStr = '';
    
    for (const word of words) {
      if ((currentLineStr + ' ' + word).length > maxCharsPerLine) {
        if (currentY < margin + lineHeight) {
          page = pdfDoc.addPage(PageSizes.A4);
          currentY = height - margin;
        }
        page.drawText(currentLineStr.trim(), {
          x: margin,
          y: currentY,
          size: fontSize,
          font: font,
          color: rgb(0.15, 0.15, 0.15)
        });
        currentY -= lineHeight;
        currentLineStr = word;
      } else {
        currentLineStr += (currentLineStr ? ' ' : '') + word;
      }
    }
    
    if (currentLineStr) {
      if (currentY < margin + lineHeight) {
        page = pdfDoc.addPage(PageSizes.A4);
        currentY = height - margin;
      }
      page.drawText(currentLineStr.trim(), {
        x: margin,
        y: currentY,
        size: fontSize,
        font: font,
        color: rgb(0.15, 0.15, 0.15)
      });
      currentY -= lineHeight;
    }
  }
  
  const bytes = await pdfDoc.save();
  return new Blob([bytes], { type: 'application/pdf' });
}

/**
 * 3. Convert Excel (.xlsx, .csv) to PDF
 */
export async function excelToPdf(excelFile) {
  const arrayBuffer = await excelFile.arrayBuffer();
  const workbook = XLSX.read(arrayBuffer, { type: 'array' });
  
  const pdfDoc = await PDFDocument.create();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  
  for (const sheetName of workbook.SheetNames) {
    const sheet = workbook.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 });
    
    if (rows.length === 0) continue;
    
    let page = pdfDoc.addPage(PageSizes.A4);
    const { width, height } = page.getSize();
    const margin = 35;
    let currentY = height - margin;
    
    // Sheet Header
    page.drawText(`Feuille : ${sheetName}`, {
      x: margin,
      y: currentY,
      size: 14,
      font: boldFont,
      color: rgb(0.38, 0.40, 0.94)
    });
    currentY -= 25;
    
    for (let r = 0; r < rows.length; r++) {
      const row = rows[r];
      if (currentY < margin + 20) {
        page = pdfDoc.addPage(PageSizes.A4);
        currentY = height - margin;
      }
      
      const rowStr = row.map(cell => String(cell || '')).slice(0, 5).join('  |  ');
      page.drawText(rowStr.substring(0, 90), {
        x: margin,
        y: currentY,
        size: 10,
        font: r === 0 ? boldFont : font,
        color: r === 0 ? rgb(0.1, 0.1, 0.3) : rgb(0.2, 0.2, 0.2)
      });
      currentY -= 18;
    }
  }
  
  const bytes = await pdfDoc.save();
  return new Blob([bytes], { type: 'application/pdf' });
}

/**
 * 4. Convert PowerPoint (.pptx) to PDF
 */
export async function powerpointToPdf(pptxFile) {
  const arrayBuffer = await pptxFile.arrayBuffer();
  const zip = await JSZip.loadAsync(arrayBuffer);
  
  // Find slide files inside PPTX zip archive
  const slideFiles = Object.keys(zip.files).filter(name => name.startsWith('ppt/slides/slide') && name.endsWith('.xml'));
  
  const pdfDoc = await PDFDocument.create();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  
  if (slideFiles.length === 0) {
    const page = pdfDoc.addPage(PageSizes.A4);
    page.drawText('Présentation PowerPoint', { x: 50, y: 700, size: 20, font: boldFont });
  } else {
    for (let i = 0; i < slideFiles.length; i++) {
      const slideXmlText = await zip.files[slideFiles[i]].async('text');
      // Extract text content inside <a:t> tags
      const textMatches = Array.from(slideXmlText.matchAll(/<a:t[^>]*>(.*?)<\/a:t>/g)).map(m => m[1]);
      
      const page = pdfDoc.addPage([842, 595]); // Landscape A4 size for PowerPoint slide
      page.drawText(`Diapositive ${i + 1}`, {
        x: 40,
        y: 550,
        size: 18,
        font: boldFont,
        color: rgb(0.38, 0.4, 0.94)
      });
      
      let y = 490;
      for (const t of textMatches) {
        if (y < 50) break;
        page.drawText(t.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>'), {
          x: 50,
          y: y,
          size: 12,
          font: font,
          color: rgb(0.15, 0.15, 0.15)
        });
        y -= 22;
      }
    }
  }
  
  const bytes = await pdfDoc.save();
  return new Blob([bytes], { type: 'application/pdf' });
}

/**
 * 5. Convert HTML string / Text to PDF
 */
export async function htmlToPdf(htmlOrText) {
  const cleanText = htmlOrText.replace(/<[^>]*>?/gm, ''); // Simple strip tags
  const pdfDoc = await PDFDocument.create();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  
  let page = pdfDoc.addPage(PageSizes.A4);
  const { width, height } = page.getSize();
  let y = height - 40;
  
  const lines = cleanText.split('\n');
  for (const line of lines) {
    if (y < 40) {
      page = pdfDoc.addPage(PageSizes.A4);
      y = height - 40;
    }
    page.drawText(line.substring(0, 85), {
      x: 40,
      y: y,
      size: 11,
      font: font
    });
    y -= 16;
  }
  
  const bytes = await pdfDoc.save();
  return new Blob([bytes], { type: 'application/pdf' });
}
