import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";

export default function PrivacidadPage() {
  return (
    <>
      <Helmet>
        <title>Política de Privacidad — Código 316</title>
        <meta name="description" content="Política de privacidad y tratamiento de datos de la plataforma Código 316." />
      </Helmet>
      <div className="legal-layout">
        <article className="legal-card">
          <Link to="/" className="legal-back">← Volver</Link>
          <h2>Política de Privacidad</h2>
          <p className="legal-date">Última actualización: junio 2026</p>

          <h3>1. Responsable del tratamiento</h3>
          <p>
            El grupo juvenil Código 3:16 es el responsable del tratamiento de tus datos
            personales. Para cualquier consulta relacionada con tus datos, puedes contactarnos
            a través de los medios indicados en la plataforma.
          </p>

          <h3>2. Datos que recolectamos</h3>
          <p>Para el funcionamiento de la plataforma, recolectamos la siguiente información:</p>
          <ul>
            <li><strong>Datos de identificación:</strong> nombre, apellidos, correo electrónico.</li>
            <li><strong>Datos de contacto:</strong> teléfono, localidad.</li>
            <li><strong>Datos demográficos:</strong> fecha de nacimiento, edad.</li>
            <li><strong>Información eclesiástica:</strong> estado de bautismo.</li>
            <li><strong>Registro de actividad:</strong> asistencias a reuniones, participación en retos y eventos, comentarios.</li>
            <li><strong>Imágenes:</strong> fotografías subidas a eventos.</li>
          </ul>

          <h3>3. Finalidad del tratamiento</h3>
          <p>
            Los datos personales se utilizan <strong>exclusivamente</strong> para:
          </p>
          <ul>
            <li>Control de asistencia a las reuniones del grupo juvenil.</li>
            <li>Registro de participación en retos y actividades.</li>
            <li>Gestión de eventos y comunicación con los participantes.</li>
            <li>Generación de reportes internos para los coordinadores del grupo.</li>
          </ul>
          <p>
            <strong>No utilizamos tus datos para fines publicitarios, comerciales, ni los
            compartimos con terceros no relacionados con el grupo.</strong>
          </p>

          <h3>4. Base legal</h3>
          <p>
            El tratamiento de tus datos se basa en tu consentimiento al registrarte en la
            plataforma y en la necesidad del tratamiento para la gestión del grupo juvenil.
          </p>

          <h3>5. Almacenamiento y seguridad</h3>
          <p>
            Tus datos se almacenan en Firebase (Google Cloud), con servidores ubicados
            principalmente en Estados Unidos. Implementamos medidas de seguridad técnicas
            y organizativas para proteger tu información, incluyendo autenticación segura
            mediante Firebase Auth y cifrado en tránsito (HTTPS).
          </p>

          <h3>6. Conservación de datos</h3>
          <p>
            Conservamos tus datos personales mientras tu cuenta esté activa. Si solicitas
            la eliminación de tu cuenta, tus datos serán eliminados en un plazo máximo de
            30 días hábiles, excepto aquellos que debamos conservar por obligaciones legales.
          </p>

          <h3>7. Tus derechos</h3>
          <p>Tienes derecho a:</p>
          <ul>
            <li><strong>Acceder</strong> a tus datos personales.</li>
            <li><strong>Rectificar</strong> datos inexactos o incompletos.</li>
            <li><strong>Solicitar la eliminación</strong> de tus datos cuando ya no sean necesarios.</li>
            <li><strong>Retirar tu consentimiento</strong> en cualquier momento.</li>
          </ul>
          <p>
            Para ejercer tus derechos, contacta a un coordinador del grupo o envía un correo
            electrónico a través de los medios indicados en la plataforma.
          </p>

          <h3>8. Cambios en esta política</h3>
          <p>
            Podemos actualizar esta política de privacidad periódicamente. Los cambios serán
            publicados en esta página y, cuando sea relevante, notificados a través de la
            plataforma.
          </p>
        </article>
      </div>
    </>
  );
}
