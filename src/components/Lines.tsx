import type { ReactNode } from "react";

/**
 * Titular que entra línea por línea detrás de una máscara.
 * Cada línea se recorta con overflow y su contenido sube a su lugar.
 * El disparo lo hace RevealProvider agregando `.in`; sin JS el texto ya está
 * visible, así que el contenido nunca depende de la animación.
 */
export default function Lines({
  as: Tag = "h2",
  className = "h2",
  lines,
  delay = 0,
}: {
  as?: "h1" | "h2" | "h3" | "p" | "div";
  className?: string;
  lines: ReactNode[];
  delay?: number;
}) {
  return (
    <Tag
      className={`lines ${className}`}
      data-lines
      style={delay ? ({ "--rd": `${delay}ms` } as React.CSSProperties) : undefined}
    >
      {lines.map((l, i) => (
        <span className="ln" key={i} style={{ "--li": i } as React.CSSProperties}>
          <span>{l}</span>
        </span>
      ))}
    </Tag>
  );
}
