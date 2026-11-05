import React from 'react';
import {
  FileText,
  FileSpreadsheet,
  Presentation,
  Image as ImageIcon,
  Archive,
  Code2,
  FileCode,
  File,
  Folder,
  FolderOpen,
} from 'lucide-react';
import { getFileCategory } from '../../utils/fileTypeUtils.ts';

interface FileIconProps {
  mimeType?: string;
  filename?: string;
  isFolder?: boolean;
  isOpen?: boolean;
  className?: string;
}

export function FileIcon({
  mimeType,
  filename = '',
  isFolder = false,
  isOpen = false,
  className = 'w-5 h-5',
}: FileIconProps) {
  if (isFolder) {
    if (isOpen) {
      return <FolderOpen className={`${className} text-amber-500`} />;
    }
    return <Folder className={`${className} text-amber-500`} />;
  }

  const category = getFileCategory(mimeType, filename);

  switch (category) {
    case 'pdf':
      return <FileText className={`${className} text-rose-500`} />;
    case 'documents':
      return <FileText className={`${className} text-blue-500`} />;
    case 'spreadsheets':
      return <FileSpreadsheet className={`${className} text-emerald-500`} />;
    case 'presentations':
      return <Presentation className={`${className} text-amber-500`} />;
    case 'images':
      return <ImageIcon className={`${className} text-teal-500`} />;
    case 'archives':
      return <Archive className={`${className} text-purple-500`} />;
    case 'code':
      return <FileCode className={`${className} text-indigo-500`} />;
    case 'text':
      return <Code2 className={`${className} text-slate-500`} />;
    default:
      return <File className={`${className} text-slate-400`} />;
  }
}
