import { useRef, useState } from 'react';

const allowedExtensions = ['.pdf', '.md', '.txt'];

function hasAllowedExtension(name = '') {
  return allowedExtensions.some((ext) => name.toLowerCase().endsWith(ext));
}

export default function Uploader({ loading, onSubmit, error }) {
  const [jobSource, setJobSource] = useState('');
  const [cvFile, setCvFile] = useState(null);
  const [localError, setLocalError] = useState('');
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

  return (
    <form className="panel uploader fade-in" onSubmit={handleSubmit}>
      <div className="uploader-head">
        <h2>Entrada de Dados</h2>
        <p>Otimize seu currículo para uma vaga específica sem inventar experiência.</p>
      </div>

      <div
        className="dropzone"
        onDragOver={(event) => event.preventDefault()}
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
        <strong>{cvFile ? cvFile.name : 'Arraste seu currículo aqui'}</strong>
        <small>ou clique para selecionar (PDF, MD, TXT)</small>
      </div>

      {cvFile && (
        <div className="file-meta">
          <span>Arquivo pronto</span>
          <span>{Math.max(1, Math.round(cvFile.size / 1024))} KB</span>
        </div>
      )}

      <label htmlFor="job-source">Descrição da vaga (URL ou texto)</label>
      <textarea
        id="job-source"
        value={jobSource}
        onChange={(event) => setJobSource(event.target.value)}
        rows={6}
        placeholder="Cole a URL da vaga ou o texto completo da descrição"
      />
      <div className="input-meta">
        <small>Mínimo recomendado: 20 caracteres.</small>
        <small>{sourceLength} caracteres</small>
      </div>

      {(localError || error) && <div className="error-box">{localError || error}</div>}

      <button type="submit" className="primary-button" disabled={loading}>
        {loading ? 'Otimizando...' : 'Otimizar Currículo'}
      </button>
    </form>
  );
}
