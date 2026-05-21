// components/ImageUpload.jsx
import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import './ImageUpload.css';

export default function ImageUpload({ onImageUpload, currentImageUrl, onRemoveImage }) {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState(currentImageUrl || null);

  const onDrop = useCallback(async (acceptedFiles) => {
    const file = acceptedFiles[0];
    if (file) {
      // Mostrar preview local
      const localPreview = URL.createObjectURL(file);
      setPreview(localPreview);
      setUploading(true);
      
      try {
        await onImageUpload(file);
      } finally {
        setUploading(false);
        // Limpiar el URL de preview local después de un tiempo
        setTimeout(() => URL.revokeObjectURL(localPreview), 1000);
      }
    }
  }, [onImageUpload]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.gif', '.webp']
    },
    maxFiles: 1,
    maxSize: 5242880, // 5MB
  });

  const handleRemoveImage = () => {
    setPreview(null);
    if (onRemoveImage) {
      onRemoveImage();
    }
  };

  return (
    <div className="image-upload-container">
      <div
        {...getRootProps()}
        className={`dropzone ${isDragActive ? 'dropzone-active' : ''} ${preview ? 'has-image' : ''}`}
      >
        <input {...getInputProps()} />
        {preview ? (
          <div className="image-preview">
            <img src={preview} alt="Preview" />
            <div className="image-overlay">
              <button 
                type="button" 
                className="btn-change-image"
                onClick={(e) => {
                  e.stopPropagation();
                  // Esto permite cambiar la imagen
                }}
              >
                📷 Cambiar imagen
              </button>
              <button 
                type="button" 
                className="btn-remove-image"
                onClick={(e) => {
                  e.stopPropagation();
                  handleRemoveImage();
                }}
              >
                ✖ Eliminar
              </button>
            </div>
          </div>
        ) : (
          <div className="upload-placeholder">
            <div className="upload-icon">📸</div>
            <p>{isDragActive ? 'Suelta la imagen aquí' : 'Arrastra una imagen o haz clic para seleccionar'}</p>
            <small>Formatos: JPG, PNG, GIF, WEBP (max. 5MB)</small>
          </div>
        )}
      </div>
      {uploading && (
        <div className="uploading-overlay">
          <div className="spinner"></div>
          <p>Subiendo imagen...</p>
        </div>
      )}
    </div>
  );
}