import ImagenConFallback from "../atoms/ImagenConFallback";

type EventImageGalleryProps = {
  imagenes: string[];
  titulo: string;
};

export default function EventImageGallery({ imagenes, titulo }: EventImageGalleryProps) {
  if (!imagenes || imagenes.length === 0) return null;

  return (
    <div className="imagenes-grid">
      {imagenes.map((imagen, index) => (
        <div key={index} className="imagen-container">
          <ImagenConFallback
            src={imagen}
            alt={`Evento ${titulo} - Imagen ${index + 1}`}
            className="evento-imagen"
          />
        </div>
      ))}
    </div>
  );
}
