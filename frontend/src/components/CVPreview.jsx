import { useState } from 'react';
import ReactMarkdown from 'react-markdown';

export default function CVPreview({ cvOtimizado }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    await navigator.clipboard.writeText(cvOtimizado || '');
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1500);
  }

  function handlePrint() {
    window.print();
  }

  return (
    <section className="panel fade-in">
      <div className="panel-header">
        <div>
          <h3>Currículo Otimizado</h3>
          <p className="panel-subtitle">Visualização em Markdown pronta para edição final.</p>
        </div>
        <div className="actions-group">
          <button type="button" className="ghost-button" onClick={handleCopy}>
            {copied ? 'Copiado' : 'Copiar Markdown'}
          </button>
          <button type="button" className="primary-button" onClick={handlePrint}>
            Salvar em PDF / Imprimir
          </button>
        </div>
      </div>

      <article className="cv-preview mono">
        <ReactMarkdown>{cvOtimizado || ''}</ReactMarkdown>
      </article>
    </section>
  );
}
