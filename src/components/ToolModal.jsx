import React, { useState } from 'react';
import { X, Download, RefreshCw, CheckCircle2, AlertCircle, FileText, Sparkles, Layers } from 'lucide-react';
import confetti from 'canvas-confetti';
import saveAs from 'file-saver';
import JSZip from 'jszip';

import FileDropzone from './FileDropzone';
import PageGridEditor from './PageGridEditor';
import SignaturePad from './SignaturePad';
import ResultPreviewer from './ResultPreviewer';
import CameraScanner from './CameraScanner';

import { getPdfThumbnails, formatBytes } from '../utils/pdfHelper';
import { TRANSLATIONS } from '../utils/translations';
import {
  mergePdfs,
  splitPdf,
  processPageOrderAndRotation,
  compressPdf,
  repairPdf,
  addWatermark,
  addSignatureToPdf,
  performOcrOnPdfOrImage,
  protectPdf,
  unlockPdf,
  addPageNumbersToPdf,
  pdfToMarkdown
} from '../utils/pdfOperations';
import {
  imagesToPdf,
  wordToPdf,
  excelToPdf,
  powerpointToPdf,
  htmlToPdf
} from '../utils/convertToPdf';
import {
  pdfToWord,
  pdfToExcel,
  pdfToPptx,
  pdfToImagesZip
} from '../utils/convertFromPdf';

export default function ToolModal({ tool, onClose, lang = 'fr' }) {
  const t = TRANSLATIONS[lang] || TRANSLATIONS.fr;
  const toolLocalized = t[tool.id] || { title: tool.id, desc: '', action: tool.actionText };

  const [files, setFiles] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [statusMessage, setStatusMessage] = useState('');
  const [resultBlob, setResultBlob] = useState(null);
  const [resultFileName, setResultFileName] = useState('');
  const [error, setError] = useState(null);

  // Tool specific states
  const [pagesState, setPagesState] = useState([]);
  const [splitRange, setSplitRange] = useState('');
  const [watermarkText, setWatermarkText] = useState('CONFIDENTIEL');
  const [watermarkOpacity, setWatermarkOpacity] = useState('0.3');
  const [watermarkColor, setWatermarkColor] = useState('#6366f1');
  const [signatureUrl, setSignatureUrl] = useState(null);
  const [signaturePageNum, setSignaturePageNum] = useState(1);
  const [ocrResultText, setOcrResultText] = useState('');
  const [ocrLang, setOcrLang] = useState('fra');
  const [compressQuality, setCompressQuality] = useState('0.5');
  const [targetSizeMb, setTargetSizeMb] = useState('');

  // New features state
  const [pdfPassword, setPdfPassword] = useState('');
  const [pageNumberFormat, setPageNumberFormat] = useState('Page {page} sur {total}');
  const [pageNumberPosition, setPageNumberPosition] = useState('bottom-center');

  const handleFilesSelected = async (selectedFiles) => {
    setFiles(selectedFiles);
    setError(null);

    // If PDF page editing tool selected, generate page thumbnails
    if (['reorder-pdf', 'rotate-pdf', 'delete-pages'].includes(tool.id) && selectedFiles.length > 0) {
      setIsProcessing(true);
      setStatusMessage(lang === 'en' ? 'Generating page thumbnails...' : 'Génération des vignettes de pages...');
      try {
        const pages = await getPdfThumbnails(selectedFiles[0]);
        setPagesState(pages);
      } catch (err) {
        setError(err.message);
      } finally {
        setIsProcessing(false);
      }
    }
  };

  const handleRemoveFile = (indexToRemove) => {
    setFiles(prev => prev.filter((_, idx) => idx !== indexToRemove));
  };

  const triggerConfetti = () => {
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 }
    });
  };

  const handleExecuteTool = async () => {
    if (files.length === 0) return;
    setIsProcessing(true);
    setError(null);
    setProgress(0);

    try {
      let outputBlob = null;
      let outputName = 'document_resultat.pdf';
      const file = files[0];

      // Handle Batch Processing if multiple files selected
      if (files.length > 1 && tool.multiple) {
        setStatusMessage(lang === 'en' ? `Processing batch (${files.length} files)...` : `Traitement par lot de ${files.length} fichiers...`);
        const zip = new JSZip();

        for (let i = 0; i < files.length; i++) {
          const currentFile = files[i];
          setProgress(Math.round(((i + 1) / files.length) * 100));

          let singleBlob = null;
          let singleName = currentFile.name;

          switch (tool.id) {
            case 'word-to-pdf':
              singleBlob = await wordToPdf(currentFile);
              singleName = currentFile.name.replace(/\.docx$/i, '.pdf');
              break;
            case 'excel-to-pdf':
              singleBlob = await excelToPdf(currentFile);
              singleName = currentFile.name.replace(/\.(xlsx|csv)$/i, '.pdf');
              break;
            case 'pptx-to-pdf':
              singleBlob = await powerpointToPdf(currentFile);
              singleName = currentFile.name.replace(/\.pptx$/i, '.pdf');
              break;
            case 'pdf-to-word':
              singleBlob = await pdfToWord(currentFile);
              singleName = currentFile.name.replace(/\.pdf$/i, '.docx');
              break;
            case 'pdf-to-excel':
              singleBlob = await pdfToExcel(currentFile);
              singleName = currentFile.name.replace(/\.pdf$/i, '.xlsx');
              break;
            case 'pdf-to-pptx':
              singleBlob = await pdfToPptx(currentFile);
              singleName = currentFile.name.replace(/\.pdf$/i, '.pptx');
              break;
            case 'pdf-to-img':
              singleBlob = await pdfToImagesZip(currentFile);
              singleName = currentFile.name.replace(/\.pdf$/i, '_images.zip');
              break;
            case 'compress-pdf':
              singleBlob = await compressPdf(currentFile, parseFloat(compressQuality), targetSizeMb);
              singleName = currentFile.name.replace(/\.pdf$/i, '_compressed.pdf');
              break;
            case 'watermark-pdf':
              singleBlob = await addWatermark(currentFile, {
                text: watermarkText,
                opacity: watermarkOpacity,
                colorHex: watermarkColor
              });
              singleName = currentFile.name.replace(/\.pdf$/i, '_watermark.pdf');
              break;
            case 'repair-pdf':
              singleBlob = await repairPdf(currentFile);
              singleName = currentFile.name.replace(/\.pdf$/i, '_repaired.pdf');
              break;
            case 'ocr-pdf':
              const ocrRes = await performOcrOnPdfOrImage(currentFile, ocrLang, (p) => setProgress(p));
              singleBlob = new Blob([ocrRes.text], { type: 'text/plain' });
              singleName = currentFile.name.replace(/\.[^/.]+$/, '_ocr.txt');
              break;
            default:
              break;
          }

          if (singleBlob) {
            zip.file(singleName, singleBlob);
          }
        }

        const zipBlob = await zip.generateAsync({ type: 'blob' });
        outputBlob = zipBlob;
        outputName = `StudentPDF_Batch_${tool.id}.zip`;
      } else {
        // Single File Processing
        switch (tool.id) {
          case 'word-to-pdf':
            setStatusMessage(lang === 'en' ? 'Converting Word document to PDF...' : 'Conversion du document Word en PDF...');
            outputBlob = await wordToPdf(file);
            outputName = file.name.replace(/\.docx$/i, '.pdf');
            break;

          case 'excel-to-pdf':
            setStatusMessage(lang === 'en' ? 'Converting Excel sheet to PDF...' : 'Conversion de la feuille Excel en PDF...');
            outputBlob = await excelToPdf(file);
            outputName = file.name.replace(/\.(xlsx|csv)$/i, '.pdf');
            break;

          case 'pptx-to-pdf':
            setStatusMessage(lang === 'en' ? 'Converting PowerPoint presentation...' : 'Conversion de la présentation PowerPoint...');
            outputBlob = await powerpointToPdf(file);
            outputName = file.name.replace(/\.pptx$/i, '.pdf');
            break;

          case 'img-to-pdf':
            setStatusMessage(lang === 'en' ? 'Assembling images into PDF...' : 'Assemblage des images en PDF...');
            outputBlob = await imagesToPdf(files);
            outputName = 'images_converties.pdf';
            break;

          case 'html-to-pdf':
            setStatusMessage(lang === 'en' ? 'Converting HTML to PDF...' : 'Conversion du code HTML en PDF...');
            outputBlob = await htmlToPdf(file);
            outputName = 'document_html.pdf';
            break;

          case 'pdf-to-word':
            setStatusMessage(lang === 'en' ? 'Extracting text to Word (.docx)...' : 'Extraction du texte vers Word (.docx)...');
            outputBlob = await pdfToWord(file);
            outputName = file.name.replace(/\.pdf$/i, '.docx');
            break;

          case 'pdf-to-md':
            setStatusMessage(lang === 'en' ? 'Exporting PDF to Markdown (.md)...' : 'Exportation du PDF en Markdown (.md)...');
            outputBlob = await pdfToMarkdown(file);
            outputName = file.name.replace(/\.pdf$/i, '.md');
            break;

          case 'pdf-to-excel':
            setStatusMessage(lang === 'en' ? 'Extracting tables to Excel (.xlsx)...' : 'Extraction des tableaux vers Excel (.xlsx)...');
            outputBlob = await pdfToExcel(file);
            outputName = file.name.replace(/\.pdf$/i, '.xlsx');
            break;

          case 'pdf-to-pptx':
            setStatusMessage(lang === 'en' ? 'Converting PDF to PowerPoint (.pptx)...' : 'Conversion du PDF en PowerPoint (.pptx)...');
            outputBlob = await pdfToPptx(file);
            outputName = file.name.replace(/\.pdf$/i, '.pptx');
            break;

          case 'pdf-to-img':
            setStatusMessage(lang === 'en' ? 'Rendering HD page images...' : 'Rendu des images de pages HD...');
            outputBlob = await pdfToImagesZip(file);
            outputName = file.name.replace(/\.pdf$/i, '_images.zip');
            break;

          case 'merge-pdf':
            setStatusMessage(lang === 'en' ? 'Merging PDF files...' : 'Fusion des fichiers PDF...');
            outputBlob = await mergePdfs(files);
            outputName = 'pdf_fusionne.pdf';
            break;

          case 'split-pdf':
            setStatusMessage(lang === 'en' ? 'Splitting PDF pages...' : 'Division des pages du PDF...');
            outputBlob = await splitPdf(file, splitRange);
            outputName = splitRange ? 'pdf_divise.pdf' : 'pdf_pages_zip.zip';
            break;

          case 'reorder-pdf':
          case 'rotate-pdf':
          case 'delete-pages':
            setStatusMessage(lang === 'en' ? 'Reordering PDF pages...' : 'Réorganisation des pages du PDF...');
            outputBlob = await processPageOrderAndRotation(file, pagesState);
            outputName = 'pdf_modifie.pdf';
            break;

          case 'compress-pdf':
            setStatusMessage(lang === 'en' ? 'Compressing PDF file...' : 'Compressification et réduction du PDF...');
            outputBlob = await compressPdf(file, parseFloat(compressQuality), targetSizeMb);
            outputName = file.name.replace(/\.pdf$/i, '_compressed.pdf');
            break;

          case 'repair-pdf':
            setStatusMessage(lang === 'en' ? 'Repairing PDF structure...' : 'Reconstruction de la structure PDF...');
            outputBlob = await repairPdf(file);
            outputName = file.name.replace(/\.pdf$/i, '_repaired.pdf');
            break;

          case 'watermark-pdf':
            setStatusMessage(lang === 'en' ? 'Adding watermark...' : 'Application du filigrane...');
            outputBlob = await addWatermark(file, {
              text: watermarkText,
              opacity: watermarkOpacity,
              colorHex: watermarkColor
            });
            outputName = file.name.replace(/\.pdf$/i, '_watermark.pdf');
            break;

          case 'sign-pdf':
            if (!signatureUrl) {
              throw new Error(lang === 'en' ? 'Please draw or save your signature first.' : 'Veuillez d\'abord dessiner votre signature.');
            }
            setStatusMessage(lang === 'en' ? 'Applying signature...' : 'Incrustation de la signature...');
            outputBlob = await addSignatureToPdf(file, signatureUrl, signaturePageNum);
            outputName = file.name.replace(/\.pdf$/i, '_signed.pdf');
            break;

          case 'ocr-pdf':
            setStatusMessage(lang === 'en' ? 'Running OCR text recognition...' : 'Lancement de l\'OCR...');
            const ocrRes = await performOcrOnPdfOrImage(file, ocrLang, (p) => setProgress(p));
            outputBlob = new Blob([ocrRes.text], { type: 'text/plain' });
            setOcrResultText(ocrRes.text);
            outputName = file.name.replace(/\.[^/.]+$/, '_ocr.txt');
            break;

          case 'protect-pdf':
            if (!pdfPassword) {
              throw new Error(lang === 'en' ? 'Please enter a password.' : 'Veuillez saisir un mot de passe.');
            }
            setStatusMessage(lang === 'en' ? 'Encrypting PDF...' : 'Chiffrement du PDF...');
            outputBlob = await protectPdf(file, pdfPassword);
            outputName = file.name.replace(/\.pdf$/i, '_protected.pdf');
            break;

          case 'unlock-pdf':
            setStatusMessage(lang === 'en' ? 'Unlocking PDF...' : 'Déverrouillage du PDF...');
            outputBlob = await unlockPdf(file, pdfPassword);
            outputName = file.name.replace(/\.pdf$/i, '_unlocked.pdf');
            break;

          case 'pagenumber-pdf':
            setStatusMessage(lang === 'en' ? 'Adding page numbers...' : 'Ajout de la numérotation...');
            outputBlob = await addPageNumbersToPdf(file, pageNumberFormat, pageNumberPosition);
            outputName = file.name.replace(/\.pdf$/i, '_numbered.pdf');
            break;

          default:
            throw new Error('Outil non pris en charge.');
        }
      }

      setResultBlob(outputBlob);
      setResultFileName(outputName);
      triggerConfetti();
    } catch (err) {
      console.error('Erreur exécution outil:', err);
      setError(err.message || 'Une erreur est survenue lors du traitement.');
    } finally {
      setIsProcessing(false);
    }
  };

  const Icon = tool.icon;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-container" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div className="tool-icon-wrapper" style={{ background: tool.bgColor, color: tool.color, padding: '0.5rem', borderRadius: '10px' }}>
              <Icon size={24} />
            </div>
            <div>
              <h2 className="modal-title">{toolLocalized.title}</h2>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{toolLocalized.desc}</p>
            </div>
          </div>
          <button className="close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="modal-body">
          {/* Custom Web Camera Scanner View */}
          {tool.id === 'camera-scanner' ? (
            <CameraScanner
              onPdfGenerated={(pdfBlob, fileName) => {
                setResultBlob(pdfBlob);
                setResultFileName(fileName);
                triggerConfetti();
              }}
              lang={lang}
            />
          ) : (
            <>
              {/* Dropzone view shown ONLY when no files are selected yet */}
              {!resultBlob && files.length === 0 && (
                <FileDropzone
                  onFilesSelected={handleFilesSelected}
                  accept={tool.accept}
                  multiple={tool.multiple}
                  existingFiles={files}
                  onRemoveFile={handleRemoveFile}
                  lang={lang}
                />
              )}
            </>
          )}

          {/* Selected Files List & Tool Controls */}
          {files.length > 0 && !resultBlob && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', padding: '1rem', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <FileText color={tool.color} size={26} />
                  <div>
                    <strong style={{ display: 'block', fontSize: '0.95rem', color: 'var(--text-main)' }}>
                      {files.length === 1 ? files[0].name : `${files.length} ${t.filesReadyBatch}`}
                    </strong>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      {files.length === 1 ? formatBytes(files[0].size) : `${t.batchTotal} : ${formatBytes(files.reduce((a, b) => a + b.size, 0))}`}
                    </span>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button
                    className="btn-secondary"
                    onClick={() => {
                      setFiles([]);
                      setPagesState([]);
                    }}
                    style={{ fontSize: '0.8rem', padding: '0.4rem 0.8rem' }}
                  >
                    <RefreshCw size={14} /> {lang === 'en' ? 'Change file' : 'Changer de fichier'}
                  </button>
                </div>
              </div>

              {/* Tool Specific Configurations */}
              {['reorder-pdf', 'rotate-pdf', 'delete-pages'].includes(tool.id) && pagesState.length > 0 && (
                <PageGridEditor pages={pagesState} setPages={setPagesState} />
              )}

              {tool.id === 'protect-pdf' && (
                <div className="form-group">
                  <label className="form-label">{t.protectPassLabel}</label>
                  <input
                    type="password"
                    className="form-input"
                    placeholder={t.protectPassPlaceholder}
                    value={pdfPassword}
                    onChange={(e) => setPdfPassword(e.target.value)}
                  />
                </div>
              )}

              {tool.id === 'unlock-pdf' && (
                <div className="form-group">
                  <label className="form-label">{t.unlockPassLabel}</label>
                  <input
                    type="password"
                    className="form-input"
                    placeholder={t.unlockPassPlaceholder}
                    value={pdfPassword}
                    onChange={(e) => setPdfPassword(e.target.value)}
                  />
                </div>
              )}

              {tool.id === 'pagenumber-pdf' && (
                <div>
                  <div className="form-group">
                    <label className="form-label">{t.pageNumberFormatLabel}</label>
                    <select className="form-select" value={pageNumberFormat} onChange={(e) => setPageNumberFormat(e.target.value)}>
                      <option value="Page {page} sur {total}">Page X / Y</option>
                      <option value="{page} / {total}">X / Y</option>
                      <option value="Page {page}">Page X</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">{t.pageNumberPosLabel}</label>
                    <select className="form-select" value={pageNumberPosition} onChange={(e) => setPageNumberPosition(e.target.value)}>
                      <option value="bottom-center">{t.posBottomCenter}</option>
                      <option value="bottom-right">{t.posBottomRight}</option>
                      <option value="top-right">{t.posTopRight}</option>
                    </select>
                  </div>
                </div>
              )}

              {tool.id === 'split-pdf' && (
                <div className="form-group">
                  <label className="form-label">{t.splitRangeLabel}</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder={t.splitRangePlaceholder}
                    value={splitRange}
                    onChange={(e) => setSplitRange(e.target.value)}
                  />
                </div>
              )}

              {tool.id === 'compress-pdf' && (
                <div>
                  <div className="form-group">
                    <label className="form-label">{t.compressLevelLabel}</label>
                    <select className="form-select" value={compressQuality} onChange={(e) => setCompressQuality(e.target.value)}>
                      <option value="0.7">{t.compressLight}</option>
                      <option value="0.5">{t.compressRecommended}</option>
                      <option value="0.3">{t.compressStrong}</option>
                    </select>
                  </div>
                  <div className="form-group" style={{ marginTop: '0.85rem' }}>
                    <label className="form-label">{t.compressTargetMbLabel}</label>
                    <input
                      type="number"
                      step="0.5"
                      min="0.5"
                      className="form-input"
                      placeholder={t.compressTargetMbPlaceholder}
                      value={targetSizeMb}
                      onChange={(e) => setTargetSizeMb(e.target.value)}
                    />
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '3px' }}>
                      {t.compressTargetMbSub}
                    </span>
                  </div>
                </div>
              )}

              {tool.id === 'watermark-pdf' && (
                <div>
                  <div className="form-group">
                    <label className="form-label">{t.watermarkTextLabel}</label>
                    <input
                      type="text"
                      className="form-input"
                      value={watermarkText}
                      onChange={(e) => setWatermarkText(e.target.value)}
                    />
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div className="form-group">
                      <label className="form-label">{t.watermarkOpacityLabel}</label>
                      <input
                        type="range"
                        min="0.1"
                        max="0.8"
                        step="0.1"
                        value={watermarkOpacity}
                        onChange={(e) => setWatermarkOpacity(e.target.value)}
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">{t.watermarkColorLabel}</label>
                      <input
                        type="color"
                        value={watermarkColor}
                        onChange={(e) => setWatermarkColor(e.target.value)}
                        style={{ height: '40px', width: '100%', cursor: 'pointer' }}
                      />
                    </div>
                  </div>
                </div>
              )}

              {tool.id === 'sign-pdf' && (
                <div>
                  <SignaturePad onSaveSignature={(url) => setSignatureUrl(url)} />
                  {signatureUrl && (
                    <div style={{ marginTop: '1rem', color: '#22c55e', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <CheckCircle2 size={18} /> {t.signatureReady}
                    </div>
                  )}
                </div>
              )}

              {tool.id === 'ocr-pdf' && (
                <div className="form-group">
                  <label className="form-label">{t.ocrLangLabel}</label>
                  <select className="form-select" value={ocrLang} onChange={(e) => setOcrLang(e.target.value)}>
                    <option value="fra">Français (French)</option>
                    <option value="eng">Anglais (English)</option>
                    <option value="spa">Espagnol (Spanish)</option>
                    <option value="deu">Allemand (German)</option>
                  </select>
                </div>
              )}

              {/* Action Button */}
              <button
                className="btn-primary"
                onClick={handleExecuteTool}
                disabled={isProcessing}
                style={{ width: '100%', marginTop: '1.5rem', justifyContent: 'center', padding: '0.9rem' }}
              >
                {isProcessing ? (
                  <>
                    <div className="loading-spinner" style={{ width: '20px', height: '20px' }} />
                    <span>{statusMessage || (lang === 'en' ? 'Processing...' : 'Traitement en cours...')}</span>
                  </>
                ) : (
                  <>
                    <Sparkles size={18} /> {files.length > 1 ? `${t.startBatch} (${files.length})` : (toolLocalized.action || tool.actionText)}
                  </>
                )}
              </button>
            </div>
          )}

          {/* Progress Bar for Batch processing & OCR */}
          {isProcessing && progress > 0 && (
            <div style={{ marginTop: '1rem' }}>
              <div style={{ height: '8px', background: 'rgba(255,255,255,0.1)', borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${progress}%`, background: 'var(--accent-gradient)', transition: 'width 0.3s' }} />
              </div>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', textAlign: 'right', marginTop: '4px' }}>
                {progress}%
              </span>
            </div>
          )}

          {/* Error Banner */}
          {error && (
            <div style={{ margin: '1rem 0', padding: '1rem', borderRadius: 'var(--radius-md)', background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#f87171', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <AlertCircle size={20} />
              <span>{error}</span>
            </div>
          )}

          {/* Success / Interactive Result Previewer View */}
          {resultBlob && (
            <ResultPreviewer
              resultBlob={resultBlob}
              resultFileName={resultFileName}
              ocrResultText={ocrResultText}
              onReset={() => {
                setResultBlob(null);
                setFiles([]);
                setPagesState([]);
                setOcrResultText('');
              }}
              lang={lang}
            />
          )}
        </div>
      </div>
    </div>
  );
}
