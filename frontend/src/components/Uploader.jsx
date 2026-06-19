import { useRef, useState } from 'react';
import { Upload, FileCheck, AlertCircle } from 'lucide-react';

const allowedExtensions = ['.pdf', '.md', '.txt'];

function hasAllowedExtension(name = '') {
  return allowedExtensions.some((ext) => name.toLowerCase().endsWith(ext));
}

export default function Uploader({ loading, onSubmit, error }) {
  const [jobSource, setJobSource] = useState('');
  const [cvFile, setCvFile] = useState(null);
  const [localError, setLocalError] = useState('');
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef(null);
  const sourceLength = jobSource.trim().length;

  function onFileSelected(file) {
    if (!file) return;

    if (!hasAllowedExtension(file.name)) {
      setLocalError('Formato inválido. Envie PDF, MD ou TXT.');
      return;
    }

    setLocalError('');
    setCvFile(file);
  }

  function handleFileInputChange(event) {
    onFileSelected(event.target.files?.[0]);
  }

  function handleDrop(event) {
    event.preventDefault();
    setDragOver(false);
    onFileSelected(event.dataTransfer.files?.[0]);
  }

  function handleSubmit(event) {
    event.preventDefault();

    if (!cvFile) {
      setLocalError('Selecione um currículo antes de continuar.');
      return;
    }

    if (!jobSource || jobSource.trim().length < 20) {
      setLocalError('A vaga precisa ter ao menos 20 caracteres.');
      return;
    }

    setLocalError('');
    onSubmit(cvFile, jobSource.trim());
  }

  const displayError = localError || error;

  return (
    <form
      className="nb-card p-6 animate-fade-up"
      onSubmit={handleSubmit}
      style={{ position: 'sticky', top: '4.5rem' }}
    >
      <div className="mb-4">
        <h2 className="text-xl font-extrabold text-nb-ink dark:text-neutral-100 m-0">
          Entrada de Dados
        </h2>
        <p className="text-nb-muted dark:text-neutral-400 text-sm mt-1">
          Otimize seu currículo para uma vaga específica sem inventar experiência.
        </p>
      </div>

      <div
        className={`border-2 border-dashed rounded-brutal p-8 text-center cursor-pointer transition-colors my-4 ${
          dragOver
            ? 'border-nb-accent bg-nb-accent/10'
            : cvFile
              ? 'border-nb-success bg-green-50 dark:bg-green-950/20'
              : 'border-nb-border dark:border-neutral-500 bg-nb-bg dark:bg-neutral-800 hover:bg-nb-accent/10 hover:border-nb-accent'
        }`}
        onDragOver={(event) => {
          event.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".pdf,.md,.txt"
          onChange={handleFileInputChange}
          hidden
        />
        {cvFile ? (
          <>
            <FileCheck className="w-10 h-10 text-nb-success mx-auto mb-3" />
            <strong className="block text-nb-ink dark:text-neutral-100 font-bold">
              {cvFile.name}
            </strong>
            <small className="block mt-1 text-nb-muted dark:text-neutral-400 text-sm">
              {Math.max(1, Math.round(cvFile.size / 1024))} KB · Clique para trocar
            </small>
          </>
        ) : (
          <>
            <Upload className="w-10 h-10 text-nb-muted dark:text-neutral-500 mx-auto mb-3" />
            <strong className="block text-nb-ink dark:text-neutral-100 font-bold">
              Arraste seu currículo aqui
            </strong>
            <small className="block mt-1 text-nb-muted dark:text-neutral-400 text-sm">
              ou clique para selecionar (PDF, MD, TXT)
            </small>
          </>
        )}
      </div>

      <label
        htmlFor="job-source"
        className="block text-sm font-bold text-nb-ink dark:text-neutral-100 mb-1"
      >
        Descrição da vaga (URL ou texto)
      </label>
      <textarea
        id="job-source"
        value={jobSource}
        onChange={(event) => setJobSource(event.target.value)}
        rows={6}
        placeholder="Cole a URL da vaga ou o texto completo da descrição"
        className="w-full rounded-brutal border-2 border-nb-border dark:border-neutral-500 bg-white dark:bg-neutral-800 dark:text-neutral-100 p-4 text-sm font-sans resize-vertical focus:outline-none focus:shadow-brutal-accent focus:border-nb-accent transition-shadow"
      />
      <div className="flex justify-between items-center text-xs text-nb-muted dark:text-neutral-400 mt-1 mb-4">
        <span>Mínimo recomendado: 20 caracteres.</span>
        <span>{sourceLength} caracteres</span>
      </div>

      {displayError && (
        <div className="bg-red-50 dark:bg-red-950/30 border-2 border-nb-danger rounded-brutal p-3 text-nb-danger font-semibold text-sm flex items-center gap-2 mb-4 animate-shake">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          {displayError}
        </div>
      )}

      <button
        type="submit"
        className="nb-btn w-full bg-nb-accent text-white py-3 px-6 text-base"
        disabled={loading}
      >
        {loading ? 'Otimizando...' : 'Otimizar Currículo'}
      </button>
    </form>
  );
}
