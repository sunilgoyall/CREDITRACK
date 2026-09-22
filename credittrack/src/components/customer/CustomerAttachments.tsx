import React, { useState, useRef } from 'react';
import { CustomerAttachment } from '../../types';
import { api } from '../../lib/api';
import { formatDate } from '../../lib/formatters';
import {
  FileText,
  UploadCloud,
  Image as ImageIcon,
  Trash2,
  Download,
  Eye,
  X,
  AlertCircle,
  Paperclip,
} from 'lucide-react';

interface CustomerAttachmentsProps {
  customerId: string;
  attachments?: CustomerAttachment[];
  isOwner?: boolean;
  onAttachmentChange?: () => void;
}

export function CustomerAttachments({
  customerId,
  attachments = [],
  isOwner = false,
  onAttachmentChange,
}: CustomerAttachmentsProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [viewingAttachment, setViewingAttachment] = useState<CustomerAttachment | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (file: File) => {
    // 5MB limit
    if (file.size > 5 * 1024 * 1024) {
      setUploadError('File size exceeds 5MB limit. Please choose a smaller file.');
      return;
    }

    setUploadError('');
    setIsUploading(true);

    try {
      const reader = new FileReader();
      reader.onload = async () => {
        try {
          const dataUrl = reader.result as string;
          await api.customers.addAttachment(customerId, {
            name: file.name,
            dataUrl,
            fileType: file.type || 'application/octet-stream',
            size: file.size,
          });
          if (onAttachmentChange) onAttachmentChange();
        } catch (err: any) {
          setUploadError(err.message || 'Failed to upload attachment.');
        } finally {
          setIsUploading(false);
        }
      };
      reader.onerror = () => {
        setUploadError('Failed to read file from your device.');
        setIsUploading(false);
      };
      reader.readAsDataURL(file);
    } catch (err: any) {
      setUploadError(err.message || 'Failed to upload file.');
      setIsUploading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  const handleDelete = async (attachmentId: string) => {
    if (!window.confirm('Are you sure you want to delete this document?')) return;
    setDeletingId(attachmentId);
    try {
      await api.customers.deleteAttachment(customerId, attachmentId);
      if (onAttachmentChange) onAttachmentChange();
    } catch (err: any) {
      alert(err.message || 'Failed to delete attachment.');
    } finally {
      setDeletingId(null);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  return (
    <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
            <Paperclip className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              Documents & Bill Slips
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                {attachments.length}
              </span>
            </h3>
            <p className="text-xs text-slate-400">
              Attach invoices, signed credit slips, ID proof, or bills
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/50 hover:bg-emerald-100 rounded-xl border border-emerald-200 dark:border-emerald-800 transition-colors cursor-pointer"
        >
          <UploadCloud className="w-3.5 h-3.5" />
          <span>{isUploading ? 'Uploading...' : 'Upload File'}</span>
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,.pdf,.doc,.docx"
          className="hidden"
          onChange={(e) => {
            if (e.target.files && e.target.files.length > 0) {
              handleFileUpload(e.target.files[0]);
            }
          }}
        />
      </div>

      {uploadError && (
        <div className="p-3 text-xs text-red-700 bg-red-50 dark:bg-red-950/50 dark:text-red-300 rounded-xl border border-red-200 dark:border-red-900 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{uploadError}</span>
        </div>
      )}

      {/* Upload Drag/Drop Box if empty */}
      {attachments.length === 0 ? (
        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className="p-6 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl text-center hover:border-emerald-500/50 transition-colors cursor-pointer bg-slate-50/50 dark:bg-slate-800/30 space-y-2"
        >
          <UploadCloud className="w-8 h-8 text-slate-400 mx-auto" />
          <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
            Click to upload or drag & drop customer bill slip
          </p>
          <p className="text-[11px] text-slate-400">
            Supports PNG, JPEG, PDF up to 5MB
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {attachments.map((att) => {
            const isImage = att.fileType.startsWith('image/');
            return (
              <div
                key={att.id}
                className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/60 flex flex-col justify-between space-y-2"
              >
                <div className="flex items-start gap-2.5">
                  <div className="w-9 h-9 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 flex items-center justify-center shrink-0 overflow-hidden">
                    {isImage ? (
                      <img
                        src={att.dataUrl}
                        alt={att.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <FileText className="w-4 h-4 text-emerald-600" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-slate-900 dark:text-white truncate" title={att.name}>
                      {att.name}
                    </p>
                    <p className="text-[10px] text-slate-400">
                      {formatFileSize(att.size)} • {formatDate(att.uploadedAt)}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-1.5 pt-2 border-t border-slate-200/60 dark:border-slate-700/60">
                  <button
                    type="button"
                    onClick={() => setViewingAttachment(att)}
                    className="p-1.5 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                    title="View preview"
                  >
                    <Eye className="w-3.5 h-3.5" />
                  </button>

                  <a
                    href={att.dataUrl}
                    download={att.name}
                    className="p-1.5 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                    title="Download document"
                  >
                    <Download className="w-3.5 h-3.5" />
                  </a>

                  {isOwner && (
                    <button
                      type="button"
                      onClick={() => handleDelete(att.id)}
                      disabled={deletingId === att.id}
                      className="p-1.5 text-red-500 hover:text-red-700 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors cursor-pointer disabled:opacity-50"
                      title="Delete attachment"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Attachment Preview Modal */}
      {viewingAttachment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs">
          <div className="relative w-full max-w-2xl p-5 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="truncate pr-4">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white truncate">
                  {viewingAttachment.name}
                </h3>
                <p className="text-xs text-slate-400">
                  {formatFileSize(viewingAttachment.size)} • Uploaded {formatDate(viewingAttachment.uploadedAt)}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setViewingAttachment(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-full bg-slate-100 dark:bg-slate-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-auto flex items-center justify-center bg-slate-50 dark:bg-slate-950 rounded-2xl p-3 min-h-[250px]">
              {viewingAttachment.fileType.startsWith('image/') ? (
                <img
                  src={viewingAttachment.dataUrl}
                  alt={viewingAttachment.name}
                  className="max-h-[60vh] max-w-full object-contain rounded-xl"
                />
              ) : (
                <div className="text-center space-y-3 p-6">
                  <FileText className="w-16 h-16 text-emerald-600 mx-auto" />
                  <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                    Preview not available for this file type.
                  </p>
                  <a
                    href={viewingAttachment.dataUrl}
                    download={viewingAttachment.name}
                    className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold text-white bg-emerald-600 rounded-xl hover:bg-emerald-700"
                  >
                    <Download className="w-4 h-4" />
                    Download File
                  </a>
                </div>
              )}
            </div>

            <div className="flex justify-end pt-2">
              <a
                href={viewingAttachment.dataUrl}
                download={viewingAttachment.name}
                className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download Attachment</span>
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
