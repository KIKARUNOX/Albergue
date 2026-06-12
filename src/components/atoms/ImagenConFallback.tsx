import { useState } from "react";

type ImagenConFallbackProps = {
  src: string;
  alt: string;
  className?: string;
};

export default function ImagenConFallback({ src, alt, className = "" }: ImagenConFallbackProps) {
  const [fallida, setFallida] = useState(false);

  if (fallida) {
    return <p className="no-evento">No se pudo cargar la imagen.</p>;
  }

  return (
    <img
      src={src}
      alt={alt}
      className={className}
      referrerPolicy="no-referrer"
      onError={() => setFallida(true)}
    />
  );
}
