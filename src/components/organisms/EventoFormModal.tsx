import { useState, useRef } from "react";
import Swal from "sweetalert2";
import { auth } from "../../firebase";
import { convertirUrls } from "../../lib/googleDrive";
import Button from "../atoms/Button";
import Input from "../atoms/Input";
import TextArea from "../atoms/TextArea";
import Label from "../atoms/Label";

type EventoFormModalProps = {
  isOpen: boolean;
  editingId: string | null;
  initialData: {
    fecha: string;
    titulo: string;
    descripcion: string;
    imagenes: string;
  };
  onClose: () => void;
  onSave: (data: {
    fecha: string;
    titulo: string;
    descripcion: string;
    imagenes: string[];
  }) => Promise<void>;
};

export default function EventoFormModal({
  isOpen,
  editingId,
  initialData,
  onClose,
  onSave,
}: EventoFormModalProps) {
  const [fecha, setFecha] = useState(initialData.fecha);
  const [titulo, setTitulo] = useState(initialData.titulo);
  const [descripcion, setDescripcion] = useState(initialData.descripcion);
  const [imagenes, setImagenes] = useState(initialData.imagenes);
  const [uploadingImages, setUploadingImages] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const uploadImageToServer = async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append("file", file);

    const idToken = await auth.currentUser?.getIdToken();
    const response = await fetch("/api/upload-evento-image", {
      method: "POST",
      headers: { authorization: `Bearer ${idToken || ""}` },
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json() as { error?: string };
      throw new Error(error.error || "Error uploading image");
    }

    const data = await response.json() as { url: string };
    return data.url;
  };

  const handleImageUpload = async (files: File[]) => {
    if (files.length === 0) return;

    setUploadingImages(true);
    try {
      const validFiles = files.filter((file) => file.type.startsWith("image/"));
      if (validFiles.length === 0) {
        await Swal.fire({ icon: "warning", title: "Error", text: "Por favor selecciona solo imágenes" });
        return;
      }

      for (const file of validFiles) {
        try {
          const url = await uploadImageToServer(file);
          setImagenes((prev) => (prev ? `${prev}\n${url}` : url));
        } catch (error) {
          console.error("Error uploading image:", error);
          await Swal.fire({ icon: "error", title: "Error al subir imagen", text: error instanceof Error ? error.message : "Error desconocido" });
        }
      }

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } finally {
      setUploadingImages(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    void handleImageUpload(files);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    const files = Array.from(e.dataTransfer.files);
    void handleImageUpload(files);
  };

  const guardar = async () => {
    if (!fecha.trim()) {
      await Swal.fire({ icon: "warning", title: "Fecha requerida", text: "Ingresa una fecha válida" });
      return;
    }
    if (!titulo.trim()) {
      await Swal.fire({ icon: "warning", title: "Título requerido", text: "Ingresa un título" });
      return;
    }

    const urlArray = convertirUrls(imagenes.split("\n"));
    if (urlArray.length === 0) {
      await Swal.fire({ icon: "warning", title: "Imágenes requeridas", text: "Carga o pega al menos una imagen" });
      return;
    }

    await onSave({ fecha, titulo, descripcion, imagenes: urlArray });
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <h3>{editingId ? "Editar Evento" : "Nuevo Evento"}</h3>

        <div className="stack-md">
          <div>
            <Label>Fecha (sábado)</Label>
            <Input type="date" name="fecha" value={fecha} onChange={(e) => setFecha(e.target.value)} required />
          </div>

          <div>
            <Label>Título</Label>
            <Input type="text" name="titulo" placeholder="Ej: Retiro Jóvenes" value={titulo} onChange={(e) => setTitulo(e.target.value)} required />
          </div>

          <div>
            <Label>Descripción</Label>
            <TextArea name="descripcion" placeholder="Descripción del evento (opcional)" value={descripcion} onChange={(e) => setDescripcion(e.target.value)} rows={3} />
          </div>

          <div>
            <Label>Imágenes</Label>
            <div
              className="image-upload-area"
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*"
                onChange={handleFileSelect}
                style={{ display: "none" }}
                disabled={uploadingImages}
              />
              <div className="upload-content">
                <span className="upload-icon">📸</span>
                <p className="upload-text">
                  {uploadingImages ? "Cargando imágenes..." : "Arrastra imágenes aquí o haz clic para seleccionar"}
                </p>
                <p className="upload-hint">Puedes cargar múltiples imágenes a la vez</p>
              </div>
            </div>

            {imagenes && (
              <div className="images-preview">
                <p className="preview-title">URLs de imágenes cargadas:</p>
                <div className="images-list">
                  {imagenes.split("\n").filter((url) => url.trim()).map((url, idx) => (
                    <div key={idx} className="image-item">
                      <span className="image-url">{url.substring(0, 50)}...</span>
                      <button type="button" className="btn-remove" onClick={() => {
                        const urls = imagenes.split("\n").filter((_, i) => i !== idx);
                        setImagenes(urls.join("\n"));
                      }}>✕</button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="manual-url-section">
              <Label className="secondary-label">O pega URLs manualmente (una por línea)</Label>
              <TextArea name="imagenes" placeholder="https://drive.google.com/..." value={imagenes} onChange={(e) => setImagenes(e.target.value)} rows={3} />
            </div>
          </div>

          <div className="modal-actions">
            <Button onClick={() => void guardar()}>{editingId ? "Actualizar" : "Crear"}</Button>
            <Button variant="secondary" onClick={onClose}>Cancelar</Button>
          </div>
        </div>
      </div>
    </div>
  );
}
