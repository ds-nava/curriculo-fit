import { useState } from 'react';
import ReactMarkdown from 'react-markdown';

export default function CVPreview({ cvOtimizado }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    await navigator.clipboard.writeText(cvOtimizado || '');
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1500);
  }

  return (
    <section className="panel fade-in">
      <div className="panel-header">
        <div>
          <h3>Currículo Otimizado</h3>
          <p className="panel-subtitle">Visualização em Markdown pronta para edição final.</p>
        </div>
        <button type="button" className="ghost-button" onClick={handleCopy}>
          {copied ? 'Copiado' : 'Copiar Markdown'}
        </button>
      </div>

      <article className="cv-preview mono">
        <ReactMarkdown>{cvOtimizado || ''}</ReactMarkdown>
      </article>
    </section>
  );
}
