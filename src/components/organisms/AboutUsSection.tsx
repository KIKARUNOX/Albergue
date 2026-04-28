import PageSection from "../templates/PageSection";
import "./AboutUsSection.css";

export default function AboutUsSection() {
  return (
    <PageSection title="Acerca de nosotros">
      <div className="about-us-footer">
        <section className="about-us-col">
          <h3>Social</h3>
          <ul className="about-us-links">
            <li>
              <a
                href="https://www.instagram.com/codigo3_16"
                target="_blank"
                rel="noreferrer"
              >
                Instagram · codigo3_16
              </a>
            </li>
            <li>
              <a
                href="https://www.facebook.com/codigo316cr"
                target="_blank"
                rel="noreferrer"
              >
                Facebook · Codigo 3:16
              </a>
            </li>
          </ul>
        </section>

        <section className="about-us-col">
          <h3>Nuestro Proposito</h3>
          <ul className="about-us-links">
            <li>Inspirar y equipar a los jovenes para vivir una fe real y autentica en Jesus.</li>
            <li>Ser una familia donde encuentres amistad, apoyo y crecimiento espiritual.</li>
            <li>Levantar una generacion que marque la diferencia en el mundo.</li>
          </ul>
        </section>

        <section className="about-us-col">
          <h3>Ubicacion</h3>
          <ul className="about-us-links">
            <li>4, Barrio La Guaria, Sarapiqui, Costa Rica</li>
          </ul>
        </section>

        <section className="about-us-col">
          <h3>Ponte en contacto</h3>
          <ul className="about-us-links">
            <li>
              <a href="mailto:red.codigo3.16@gmail.com">
                red.codigo3.16@gmail.com
              </a>
            </li>
          </ul>
        </section>
      </div>
    </PageSection>
  );
}
