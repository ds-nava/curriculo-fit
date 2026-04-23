import { useState } from 'react';
import Uploader from '../components/Uploader';
import CVPreview from '../components/CVPreview';
import FitAnalysis from '../components/FitAnalysis';
import { optimizeCv } from '../services/api';

export default function Optimizer() {
  const [status, setStatus] = useState('idle');
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);
  const [activeTab, setActiveTab] = useState('curriculo');

  async function handleOptimize(cvFile, jobSource) {
    try {
      setStatus('loading');
      setError('');
      const data = await optimizeCv(cvFile, jobSource);
      setResult(data);
      setActiveTab('curriculo');
      setStatus('success');
    } catch (err) {
      setStatus('error');
      setError(err.message || 'Falha ao otimizar currículo.');
    }
  }

  return (
    <main className="app-shell">
      <section className="app-hero fade-in">
        <span className="hero-kicker">CurriculoFit Studio</span>
        <h1>Seu currículo, calibrado para a vaga certa.</h1>
        <p>
          Envie o CV, descreva a oportunidade e receba uma versão otimizada com análise objetiva de compatibilidade.
        </p>
      </section>

      <section className={status === 'success' && result ? 'workspace two-columns' : 'workspace'}>
        <aside className="workspace-main">
          <Uploader loading={status === 'loading'} onSubmit={handleOptimize} error={error} />
        </aside>

        {status === 'success' && result && (
          <section className="panel results fade-in">
            <div className="results-header">
              <h2>Resultado da Otimização</h2>
              <span className="result-chip">{status === 'loading' ? 'Processando' : 'Concluído'}</span>
            </div>

            <div className="tabs" role="tablist" aria-label="Visualização de resultados">
              <button
                className={activeTab === 'curriculo' ? 'tab active' : 'tab'}
                onClick={() => setActiveTab('curriculo')}
                type="button"
              >
                Currículo
              </button>
              <button
                className={activeTab === 'analise' ? 'tab active' : 'tab'}
                onClick={() => setActiveTab('analise')}
                type="button"
              >
                Análise
              </button>
            </div>

            {activeTab === 'curriculo' ? (
              <CVPreview cvOtimizado={result.cv_otimizado} />
            ) : (
              <FitAnalysis analise={result.analise} />
            )}
          </section>
        )}
      </section>
    </main>
  );
}
