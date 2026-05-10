import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ShieldCheck, Download, X } from 'lucide-react';

interface PdfPreviewModalProps {
  previewPdf: { url: string; fileName: string } | null;
  title?: string;
  onClose: () => void;
  onDownload: () => void;
}

export const PdfPreviewModal: React.FC<PdfPreviewModalProps> = ({
  previewPdf,
  title = "Pratinjau PDF",
  onClose,
  onDownload
}) => {
  return (
    <AnimatePresence>
      {previewPdf && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-900/90 backdrop-blur-xl"
          />
          <motion.div 
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className="relative w-full max-w-6xl h-[92vh] bg-white rounded-[3rem] shadow-2xl overflow-hidden flex flex-col border border-white/20"
          >
            <div className="px-10 py-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-5">
                <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center shadow-inner">
                  <ShieldCheck size={24} />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900 uppercase tracking-tighter">{title}</h3>
                  <p className="text-[10px] text-slate-400 font-bold italic tracking-widest">{previewPdf.fileName}</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <button 
                  onClick={onDownload}
                  className="flex items-center gap-2 px-8 py-3 bg-blue-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] hover:bg-blue-700 transition-all shadow-xl shadow-blue-100"
                >
                  <Download size={14} />
                  Download PDF
                </button>
                <button 
                  onClick={onClose}
                  className="p-4 text-slate-300 hover:text-slate-900 hover:bg-slate-100 rounded-full transition-all"
                >
                  <X size={24} />
                </button>
              </div>
            </div>
            <div className="flex-1 bg-slate-200/30 p-2 relative">
              <iframe 
                src={previewPdf.url} 
                className="w-full h-full rounded-[2rem] shadow-2xl border border-white"
                title="PDF Preview"
              />
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
