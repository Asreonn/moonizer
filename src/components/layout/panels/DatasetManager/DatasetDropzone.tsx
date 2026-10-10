import React, { useState, useRef } from 'react';
import { useLanguage } from '../../../../core/i18n/LanguageProvider';
import styles from './DatasetDropzone.module.css';

interface DatasetDropzoneProps {
  onFileSelect: (file: File) => void;
  isProcessing?: boolean;
}

export function DatasetDropzone({ onFileSelect, isProcessing = false }: DatasetDropzoneProps) {
  const { t } = useLanguage();
  const [isDragOver, setIsDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const dragCounterRef = useRef(0);

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current++;
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      setIsDragOver(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current--;
    if (dragCounterRef.current === 0) {
      setIsDragOver(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    dragCounterRef.current = 0;

    const files = Array.from(e.dataTransfer.files);
    const csvFile = files.find(file => file.type === 'text/csv' || file.name.endsWith('.csv'));
    
    if (csvFile) {
      onFileSelect(csvFile);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onFileSelect(file);
    }
    if (inputRef.current) {
      inputRef.current.value = '';
    }
  };

  const handleClick = () => {
    if (!isProcessing) {
      inputRef.current?.click();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleClick();
    }
  };

  const dropzoneClasses = [
    styles.dropzone,
    isDragOver && styles['dropzone--dragOver'],
    isProcessing && styles['dropzone--processing'],
  ].filter(Boolean).join(' ');

  return (
    <div
      className={dropzoneClasses}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      role="button"
      aria-label={t('dataset.actions.upload')}
      aria-describedby="dropzone-description"
    >
      <div className={styles.dropzone__content}>
        {isProcessing ? (
          <svg className={styles.dropzone__icon} viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path d="M21 12a9 9 0 11-6.219-8.56"/>
          </svg>
        ) : (
          <svg className={styles.dropzone__icon} viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
            <polyline points="7,10 12,15 17,10"/>
            <line x1="12" y1="15" x2="12" y2="3"/>
          </svg>
        )}
        
        <h3 className={styles.dropzone__title}>
          {isProcessing 
            ? t('placeholders.dataset.loading')
            : isDragOver 
              ? t('dataset.dropzone.dragOver')
              : t('dataset.dropzone.title')
          }
        </h3>
        
        {!isProcessing && (
          <p className={styles.dropzone__hint}>
            {t('dataset.dropzone.hint')}
          </p>
        )}
        
        <div className={styles.dropzone__status} id="dropzone-description">
          {t('dataset.dropzone.accepted')}
        </div>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept=".csv,text/csv"
        onChange={handleFileSelect}
        className={styles.dropzone__input}
        aria-hidden="true"
      />
    </div>
  );
}