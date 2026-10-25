import React from 'react';
import {
  FileCode,
  FileSpreadsheet,
  Presentation,
  Image as ImageIcon,
  Code,
  FileText,
  Combine,
  Scissors,
  Trash2,
  RotateCw,
  Move,
  Minimize2,
  Wrench,
  PenTool,
  Stamp,
  ScanText,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  Lock,
  Unlock,
  Hash,
  FileJson,
  Camera
} from 'lucide-react';
import { TRANSLATIONS } from '../utils/translations';

export const TOOLS_CONFIG = [
  // 1. Conversions Vers PDF
  {
    id: 'word-to-pdf',
    category: 'to-pdf',
    icon: FileCode,
    color: '#3b82f6',
    bgColor: 'rgba(59, 130, 246, 0.15)',
    popular: true,
    accept: '.docx',
    multiple: true,
    actionText: 'Word'
  },
  {
    id: 'excel-to-pdf',
    category: 'to-pdf',
    icon: FileSpreadsheet,
    color: '#10b981',
    bgColor: 'rgba(16, 185, 129, 0.15)',
    accept: '.xlsx,.csv',
    multiple: true,
    actionText: 'Excel'
  },
  {
    id: 'pptx-to-pdf',
    category: 'to-pdf',
    icon: Presentation,
    color: '#f97316',
    bgColor: 'rgba(249, 115, 22, 0.15)',
    accept: '.pptx',
    multiple: true,
    actionText: 'PowerPoint'
  },
  {
    id: 'img-to-pdf',
    category: 'to-pdf',
    icon: ImageIcon,
    color: '#ec4899',
    bgColor: 'rgba(236, 72, 153, 0.15)',
    popular: true,
    accept: 'image/jpeg,image/png,image/webp,image/tiff',
    multiple: true,
    actionText: 'Images'
  },
  {
    id: 'html-to-pdf',
    category: 'to-pdf',
    icon: Code,
    color: '#06b6d4',
    bgColor: 'rgba(6, 182, 212, 0.15)',
    accept: '.html,.txt',
    actionText: 'HTML'
  },
  {
    id: 'camera-scanner',
    category: 'to-pdf',
    icon: Camera,
    color: '#10b981',
    bgColor: 'rgba(16, 185, 129, 0.15)',
    popular: true,
    actionText: 'Scanner'
  },

  // 2. Conversions Depuis PDF
  {
    id: 'pdf-to-word',
    category: 'from-pdf',
    icon: FileText,
    color: '#6366f1',
    bgColor: 'rgba(99, 102, 241, 0.15)',
    popular: true,
    accept: '.pdf',
    multiple: true,
    actionText: 'Word'
  },
  {
    id: 'pdf-to-md',
    category: 'from-pdf',
    icon: FileJson,
    color: '#0284c7',
    bgColor: 'rgba(2, 132, 199, 0.15)',
    popular: true,
    accept: '.pdf',
    actionText: 'Markdown'
  },
  {
    id: 'pdf-to-excel',
    category: 'from-pdf',
    icon: FileSpreadsheet,
    color: '#10b981',
    bgColor: 'rgba(16, 185, 129, 0.15)',
    accept: '.pdf',
    multiple: true,
    actionText: 'Excel'
  },
  {
    id: 'pdf-to-pptx',
    category: 'from-pdf',
    icon: Presentation,
    color: '#f97316',
    bgColor: 'rgba(249, 115, 22, 0.15)',
    accept: '.pdf',
    multiple: true,
    actionText: 'PPTX'
  },
  {
    id: 'pdf-to-img',
    category: 'from-pdf',
    icon: ImageIcon,
    color: '#8b5cf6',
    bgColor: 'rgba(139, 92, 246, 0.15)',
    accept: '.pdf',
    multiple: true,
    actionText: 'Images'
  },

  // 3. Organisation & Réorganisation
  {
    id: 'merge-pdf',
    category: 'organize',
    icon: Combine,
    color: '#a855f7',
    bgColor: 'rgba(168, 85, 247, 0.15)',
    popular: true,
    accept: '.pdf',
    multiple: true,
    actionText: 'Fusionner'
  },
  {
    id: 'pagenumber-pdf',
    category: 'organize',
    icon: Hash,
    color: '#3b82f6',
    bgColor: 'rgba(59, 130, 246, 0.15)',
    popular: true,
    accept: '.pdf',
    actionText: 'Numéroter'
  },
  {
    id: 'split-pdf',
    category: 'organize',
    icon: Scissors,
    color: '#eab308',
    bgColor: 'rgba(234, 179, 8, 0.15)',
    accept: '.pdf',
    actionText: 'Diviser'
  },
  {
    id: 'delete-pages',
    category: 'organize',
    icon: Trash2,
    color: '#ef4444',
    bgColor: 'rgba(239, 68, 68, 0.15)',
    accept: '.pdf',
    actionText: 'Supprimer'
  },
  {
    id: 'rotate-pdf',
    category: 'organize',
    icon: RotateCw,
    color: '#14b8a6',
    bgColor: 'rgba(20, 184, 166, 0.15)',
    accept: '.pdf',
    actionText: 'Pivoter'
  },
  {
    id: 'reorder-pdf',
    category: 'organize',
    icon: Move,
    color: '#3b82f6',
    bgColor: 'rgba(59, 130, 246, 0.15)',
    popular: true,
    accept: '.pdf',
    actionText: 'Réorganiser'
  },

  // 4. Sécurité & Édition
  {
    id: 'protect-pdf',
    category: 'edit-security',
    icon: Lock,
    color: '#ef4444',
    bgColor: 'rgba(239, 68, 68, 0.15)',
    popular: true,
    accept: '.pdf',
    actionText: 'Protéger'
  },
  {
    id: 'unlock-pdf',
    category: 'edit-security',
    icon: Unlock,
    color: '#10b981',
    bgColor: 'rgba(16, 185, 129, 0.15)',
    accept: '.pdf',
    actionText: 'Déverrouiller'
  },
  {
    id: 'sign-pdf',
    category: 'edit-security',
    icon: PenTool,
    color: '#ec4899',
    bgColor: 'rgba(236, 72, 153, 0.15)',
    popular: true,
    accept: '.pdf',
    actionText: 'Signer'
  },
  {
    id: 'watermark-pdf',
    category: 'edit-security',
    icon: Stamp,
    color: '#8b5cf6',
    bgColor: 'rgba(139, 92, 246, 0.15)',
    accept: '.pdf',
    multiple: true,
    actionText: 'Filigrane'
  },

  // 5. Optimisation & OCR
  {
    id: 'compress-pdf',
    category: 'optimize',
    icon: Minimize2,
    color: '#10b981',
    bgColor: 'rgba(16, 185, 129, 0.15)',
    popular: true,
    accept: '.pdf',
    multiple: true,
    actionText: 'Compresser'
  },
  {
    id: 'repair-pdf',
    category: 'optimize',
    icon: Wrench,
    color: '#f59e0b',
    bgColor: 'rgba(245, 158, 11, 0.15)',
    accept: '.pdf',
    multiple: true,
    actionText: 'Réparer'
  },
  {
    id: 'ocr-pdf',
    category: 'optimize',
    icon: ScanText,
    color: '#6366f1',
    bgColor: 'rgba(99, 102, 241, 0.15)',
    popular: true,
    accept: '.pdf,image/*',
    multiple: true,
    actionText: 'OCR'
  }
];

export default function ToolGrid({ currentCategory, setCategory, searchQuery, onSelectTool, lang = 'fr' }) {
  const t = TRANSLATIONS[lang] || TRANSLATIONS.fr;

  const categories = [
    { id: 'all', label: t.catAll },
    { id: 'to-pdf', label: t.catToPdf },
    { id: 'from-pdf', label: t.catFromPdf },
    { id: 'organize', label: t.catOrganize },
    { id: 'edit-security', label: t.catEditSecurity },
    { id: 'optimize', label: t.catOptimize },
  ];

  const filteredTools = TOOLS_CONFIG.filter((tool) => {
    const toolLocalized = t[tool.id] || {};
    const matchesCategory = currentCategory === 'all' || tool.category === currentCategory;
    const matchesSearch =
      !searchQuery ||
      (toolLocalized.title && toolLocalized.title.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (toolLocalized.desc && toolLocalized.desc.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  const ArrowIcon = lang === 'ar' ? ArrowLeft : ArrowRight;

  return (
    <section className="tools-section">
      {/* Category Pills Filter Bar */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '0.5rem',
          marginBottom: '2.5rem'
        }}
      >
        {categories.map((cat) => (
          <button
            key={cat.id}
            className={`category-pill ${currentCategory === cat.id ? 'active' : ''}`}
            onClick={() => setCategory(cat.id)}
            style={{
              padding: '0.5rem 1.1rem',
              fontSize: '0.875rem',
              borderRadius: 'var(--radius-full)'
            }}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Tools Cards Grid */}
      <div className="tools-grid">
        {filteredTools.map((tool) => {
          const Icon = tool.icon;
          const toolLocalized = t[tool.id] || { title: tool.id, desc: '', action: tool.actionText };

          return (
            <div
              key={tool.id}
              className="tool-card"
              style={{
                '--tool-color': tool.color,
                '--tool-bg': tool.bgColor,
              }}
              onClick={() => onSelectTool({ ...tool, title: toolLocalized.title, description: toolLocalized.desc })}
            >
              <div className="tool-header">
                <div className="tool-icon-wrapper">
                  <Icon size={26} />
                </div>
                <div>
                  <h3 className="tool-title">
                    {toolLocalized.title}
                    {tool.popular && <span className="tool-badge-popular">{t.popularBadge}</span>}
                    {tool.multiple && (
                      <span className="tool-badge-popular" style={{ background: 'rgba(99, 102, 241, 0.2)', color: '#818cf8', marginLeft: '4px' }}>
                        {t.batchBadge}
                      </span>
                    )}
                  </h3>
                </div>
              </div>
              <p className="tool-description">{toolLocalized.desc}</p>
              <div className="tool-footer">
                <span>{toolLocalized.action || tool.actionText}</span>
                <span className="tool-action-arrow">
                  <ArrowIcon size={16} />
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {filteredTools.length === 0 && (
        <div style={{ textAlign: 'center', padding: '4rem 1rem', color: 'var(--text-muted)' }}>
          <Sparkles size={48} style={{ marginBottom: '1rem', opacity: 0.4 }} />
          <h3>{t.noToolFound}</h3>
          <p>{t.trySearchAgain}</p>
        </div>
      )}
    </section>
  );
}
