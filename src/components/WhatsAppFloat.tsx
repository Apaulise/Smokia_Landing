import { links } from "@/config";
import { FaWhatsapp } from "react-icons/fa";

/** Acceso flotante que se expande al enfocarlo. Radio y densidad del sistema. */
export default function WhatsAppFloat() {
  return (
    <a className="wa" href={links.whatsapp} target="_blank" rel="noopener noreferrer" aria-label="Escribinos por WhatsApp">
      <FaWhatsapp size={22} />
      <span aria-hidden="true">Escribinos</span>
    </a>
  );
}
