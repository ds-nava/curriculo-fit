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
      <Uploader loading={status === 'loading'} onSubmit={handleOptimize} error={error} />

      {status === 'success' && result && (
        <section className="panel results fade-in">
          <div className="tabs">
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
    </main>
  );
}
