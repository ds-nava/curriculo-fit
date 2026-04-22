import ReactMarkdown from 'react-markdown';

export default function CVPreview({ cvOtimizado }) {
  async function handleCopy() {
    await navigator.clipboard.writeText(cvOtimizado || '');
  }

  return (
    <section className="panel fade-in">
      <div className="panel-header">
        <h2>Currículo Otimizado</h2>
        <button type="button" className="ghost-button" onClick={handleCopy}>
          Copiar Markdown
        </button>
      </div>

      <article className="cv-preview mono">
        <ReactMarkdown>{cvOtimizado || ''}</ReactMarkdown>
      </article>
    </section>
  );
}
