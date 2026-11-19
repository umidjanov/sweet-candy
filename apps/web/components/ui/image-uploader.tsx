'use client';

import React, { useRef, useState } from 'react';
import { Upload, Trash2, Loader2, Image as ImageIcon, Link2, AlertCircle } from 'lucide-react';
import { Button } from './button';
import { uploadImage, uploadImages } from '@/lib/api';
import { useTranslation } from '@/lib/i18n';

interface ImageUploaderProps {
  value: string[];
  onChange: (urls: string[]) => void;
  multiple?: boolean;
  label?: string;
  helperText?: string;
  showUrlInput?: boolean;
  previewAspect?: 'square' | 'banner';
}

export const ImageUploader: React.FC<ImageUploaderProps> = ({
  value,
  onChange,
  multiple = false,
  label,
  helperText,
  showUrlInput = true,
  previewAspect = 'square',
}) => {
  const { t } = useTranslation();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [urlInput, setUrlInput] = useState('');
  const [error, setError] = useState('');

  const u = t.imageUpload;

  const processFiles = async (fileList: FileList | File[]) => {
    setError('');
    const files = Array.from(fileList);
    if (files.length === 0) return;

    const validFiles: File[] = [];
    for (const file of files) {
      if (!file.type.startsWith('image/')) {
        setError(u.invalidFile);
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        setError(u.tooLarge);
        return;
      }
      validFiles.push(file);
    }

    const toUpload = multiple ? validFiles : [validFiles[0]];

    try {
      setUploading(true);
      if (multiple) {
        const uploadedUrls = await uploadImages(toUpload);
        onChange([...value, ...uploadedUrls]);
      } else {
        const uploadedUrl = await uploadImage(toUpload[0]);
        onChange([uploadedUrl]);
      }
    } catch (err: any) {
      setError(err?.message || u.uploadFailed);
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFiles(e.target.files);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFiles(e.dataTransfer.files);
    }
  };

  const handleAddUrl = () => {
    const trimmed = urlInput.trim();
    if (!trimmed) return;
    setError('');
    if (multiple) {
      onChange([...value, trimmed]);
    } else {
      onChange([trimmed]);
    }
    setUrlInput('');
  };

  const handleRemove = (index: number) => {
    onChange(value.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-3">
      {label && (
        <label className="block text-xs font-semibold uppercase tracking-wider text-[#29252A]">
          {label}
        </label>
      )}
      {helperText && <p className="text-xs text-[#817781]">{helperText}</p>}

      {/* Hidden Native File/Gallery Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple={multiple}
        onChange={handleFileChange}
        className="hidden"
      />

      {/* Clickable Upload & Drop Zone */}
      <div
        onClick={() => !uploading && fileInputRef.current?.click()}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        className={`relative rounded-2xl border-2 border-dashed p-6 text-center cursor-pointer transition-all ${
          dragActive
            ? 'border-[#E85D8E] bg-[#FFF0F5]'
            : 'border-[#E85D8E]/40 bg-[#FFF8EF]/50 hover:border-[#E85D8E] hover:bg-[#FFF0F5]/50'
        } ${uploading ? 'pointer-events-none opacity-75' : ''}`}
      >
        <div className="flex flex-col items-center justify-center gap-2.5">
          <div className="w-12 h-12 rounded-2xl bg-white border border-[#EEE6E9] shadow-sm flex items-center justify-center text-[#E85D8E]">
            {uploading ? (
              <Loader2 className="w-6 h-6 animate-spin" />
            ) : (
              <Upload className="w-6 h-6" />
            )}
          </div>

          <div className="space-y-0.5">
            <p className="text-sm font-bold text-[#29252A]">
              {uploading ? u.uploading : u.dropTitle}
            </p>
            <p className="text-xs text-[#817781]">{u.dropSubtitle}</p>
          </div>

          <Button
            type="button"
            variant="primary"
            size="sm"
            disabled={uploading}
            className="rounded-xl mt-1"
            onClick={(e) => {
              e.stopPropagation();
              fileInputRef.current?.click();
            }}
          >
            <ImageIcon className="w-4 h-4 mr-1.5" />
            {u.chooseBtn}
          </Button>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Optional URL Paste Fallback */}
      {showUrlInput && (
        <div className="flex flex-col xs:flex-row items-stretch xs:items-center gap-2">
          <div className="relative flex-1 min-w-0">
            <Link2 className="w-3.5 h-3.5 text-[#817781] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="url"
              placeholder={u.orPasteUrl}
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddUrl();
                }
              }}
              className="w-full pl-9 pr-3 py-2 bg-white border border-[#EEE6E9] rounded-xl text-xs text-[#29252A] focus:outline-none focus:border-[#E85D8E]"
            />
          </div>
          <Button type="button" variant="outline" size="sm" onClick={handleAddUrl} className="rounded-xl whitespace-nowrap">
            {u.addUrlBtn}
          </Button>
        </div>
      )}

      {/* Previews */}
      {value.length > 0 && (
        <div
          className={
            multiple
              ? 'grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1'
              : 'pt-1'
          }
        >
          {value.map((url, idx) => (
            <div
              key={`${url}-${idx}`}
              className={`relative rounded-2xl overflow-hidden border border-[#EEE6E9] bg-[#FAF8F6] group ${
                multiple
                  ? 'aspect-square'
                  : previewAspect === 'banner'
                  ? 'aspect-[3/1] max-w-md'
                  : 'w-28 h-28'
              }`}
            >
              <img
                src={url}
                alt={`Preview ${idx + 1}`}
                className="w-full h-full object-cover"
              />
              {multiple && idx === 0 && (
                <span className="absolute bottom-2 left-2 px-2 py-0.5 rounded-lg bg-[#29252A]/75 text-white text-[10px] font-bold">
                  {u.coverBadge}
                </span>
              )}
              <button
                type="button"
                onClick={() => handleRemove(idx)}
                className="absolute top-2 right-2 p-1.5 rounded-full bg-white/95 text-rose-600 shadow-sm opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity hover:bg-rose-50"
                title={t.common.delete}
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

