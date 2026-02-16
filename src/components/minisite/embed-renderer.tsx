"use client";

import { useRef, useEffect } from "react";

interface EmbedRendererProps {
  html: string;
  className?: string;
}

export function EmbedRenderer({ html, className }: EmbedRendererProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current || !html) return;

    containerRef.current.innerHTML = "";

    const temp = document.createElement("div");
    temp.innerHTML = html;

    Array.from(temp.childNodes).forEach((node) => {
      if (node.nodeName === "SCRIPT") {
        const oldScript = node as HTMLScriptElement;
        const script = document.createElement("script");
        Array.from(oldScript.attributes).forEach((attr) => {
          script.setAttribute(attr.name, attr.value);
        });
        if (oldScript.textContent) {
          script.textContent = oldScript.textContent;
        }
        containerRef.current!.appendChild(script);
      } else {
        containerRef.current!.appendChild(node.cloneNode(true));
      }
    });
  }, [html]);

  return <div ref={containerRef} className={className} />;
}
