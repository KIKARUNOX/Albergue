import { useState } from "react";
import { construirCandidatas } from "../../lib/googleDrive";

type ImagenConFallbackProps = {
  src: string;
  alt: string;
  className?: string;
};

export default function ImagenConFallback({ src, alt, className = "" }: ImagenConFallbackProps) {
  const candidatas = construirCandidatas(src);
  const [intento, setIntento] = useState(0);
  const [fallida, setFallida] = useState(false);

  const srcActual = candidatas[Math.min(intento, candidatas.length - 1)];

  if (fallida) {
    return <p className="no-evento">No se pudo cargar la imagen (Drive requiere enlace publico).</p>;
  }

  return (
    <img
      src={srcActual}
      alt={alt}
      className={className}
      referrerPolicy="no-referrer"
      onError={() => {
        const siguiente = intento + 1;
        if (siguiente >= candidatas.length) {
          setFallida(true);
        } else {
          setIntento(siguiente);
        }
      }}
    />
  );
}
