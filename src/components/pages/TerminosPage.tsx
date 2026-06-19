import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";

export default function TerminosPage() {
  return (
    <>
      <Helmet>
        <title>Términos de Uso — Código 316</title>
        <meta name="description" content="Términos y condiciones de uso de la plataforma Código 316." />
      </Helmet>
      <div className="legal-layout">
        <article className="legal-card">
          <Link to="/" className="legal-back">← Volver</Link>
          <h2>Términos de Uso</h2>
          <p className="legal-date">Última actualización: junio 2026</p>

          <h3>1. Descripción del servicio</h3>
          <p>
            Código 316 es una plataforma de gestión y control de asistencia para el grupo juvenil
            Código 3:16. La plataforma permite registrar la participación de los jóvenes en
            actividades, retos y eventos organizados por el grupo.
          </p>

          <h3>2. Registro y cuenta</h3>
          <p>
            Para usar la plataforma debes crear una cuenta proporcionando tu nombre, apellidos,
            correo electrónico y una contraseña. Eres responsable de mantener la confidencialidad
            de tu cuenta y contraseña, y de toda actividad que ocurra bajo tu cuenta.
          </p>
          <p>
            La información que proporciones debe ser veraz y completa. El grupo Código 3:16 se
            reserva el derecho de suspender cuentas que proporcionen información falsa.
          </p>

          <h3>3. Roles y permisos</h3>
          <p>
            La plataforma contempla tres roles: <strong>joven</strong> (acceso básico),
            <strong>coordinador</strong> (gestión de personas y asistencias), y
            <strong>líder</strong> (acceso administrativo completo). Los permisos asociados a
            cada rol son asignados por los coordinadores y líderes del grupo.
          </p>

          <h3>4. Uso aceptable</h3>
          <p>
            Te comprometes a usar la plataforma únicamente para los fines previstos:
            registro de asistencia, participación en actividades y retos, y comunicación
            relacionada con el grupo juvenil. No está permitido:
          </p>
          <ul>
            <li>Usar la plataforma para fines distintos a los del grupo juvenil.</li>
            <li>Intentar acceder a información de otros usuarios sin autorización.</li>
            <li>Publicar contenido ofensivo, discriminatorio o inapropiado en comentarios.</li>
            <li>Realizar actividades que puedan dañar o interferir con el funcionamiento del sistema.</li>
          </ul>

          <h3>5. Limitación de responsabilidad</h3>
          <p>
            La plataforma se proporciona "tal cual". Código 3:16 no se hace responsable por
            daños directos o indirectos derivados del uso de la plataforma, incluyendo pero no
            limitado a pérdida de datos o interrupciones del servicio.
          </p>

          <h3>6. Modificaciones</h3>
          <p>
            Nos reservamos el derecho de modificar estos términos en cualquier momento. Los
            cambios serán notificados a través de la plataforma y entrarán en vigor al
            publicarse. El uso continuado de la plataforma después de los cambios constituye
            la aceptación de los nuevos términos.
          </p>

          <h3>7. Contacto</h3>
          <p>
            Si tienes preguntas sobre estos términos, puedes contactarnos a través de los
            medios indicados en la sección "Acerca de" de la plataforma.
          </p>
        </article>
      </div>
    </>
  );
}
