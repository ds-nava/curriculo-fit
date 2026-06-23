import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { Copy, Check, Printer } from 'lucide-react';

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
    <section className="animate-fade-up">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
        <div>
          <h3 className="text-lg font-extrabold text-nb-ink dark:text-neutral-100 m-0">
            Currículo Otimizado
          </h3>
          <p className="text-nb-muted dark:text-neutral-400 text-sm mt-0.5">
            Visualização em Markdown pronta para edição final.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="nb-btn bg-nb-surface dark:bg-neutral-800 dark:text-neutral-100 text-nb-ink px-4 py-2 text-sm flex items-center gap-2"
            onClick={handleCopy}
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 text-nb-success" />
                Copiado
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                Copiar MD
              </>
            )}
          </button>
          <button
            type="button"
            className="nb-btn bg-nb-accent text-white px-4 py-2 text-sm flex items-center gap-2"
            onClick={handlePrint}
          >
            <Printer className="w-4 h-4" />
            PDF / Imprimir
          </button>
        </div>
      </div>

      <div className="relative">
        <span className="absolute top-3 right-3 text-[10px] font-bold bg-nb-bg dark:bg-neutral-700 text-nb-muted dark:text-neutral-400 px-2 py-0.5 border-2 border-nb-border dark:border-neutral-500 rounded-brutal z-10">
          Markdown
        </span>
        <article className="cv-preview cv-markdown border-2 border-nb-border dark:border-neutral-500 rounded-brutal p-8 md:p-10 bg-white dark:bg-neutral-800 dark:text-neutral-100 max-h-[650px] overflow-auto">
          <ReactMarkdown>{cvOtimizado || ''}</ReactMarkdown>
        </article>
      </div>
    </section>
  );
}
