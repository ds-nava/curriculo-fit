import { useState } from 'react';
import Uploader from '../components/Uploader';
import CVPreview from '../components/CVPreview';
import FitAnalysis from '../components/FitAnalysis';
import { optimizeCv } from '../services/api';
import { USE_MOCK_DATA, getMockDelay } from '../testConfig';
import { mockAnalysisResponse } from '../mockData';

export default function Optimizer() {
  const [status, setStatus] = useState('idle');
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);
  const [activeTab, setActiveTab] = useState('curriculo');

  async function handleOptimize(cvFile, jobSource) {
    try {
      setStatus('loading');
      setError('');
      
      let data;
      if (USE_MOCK_DATA) {
        // Modo TESTE: usa dados mock locais
        console.log('🧪 MODO TESTE: Usando dados mock (sem chamar IA)');
        await getMockDelay(); // Simula latência
        data = mockAnalysisResponse;
      } else {
        // Modo PRODUÇÃO: chama a API real
        console.log('🚀 MODO PRODUÇÃO: Chamando API de IA');
        data = await optimizeCv(cvFile, jobSource);
      }
      
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
        <span className="hero-kicker">CurriculoFit</span>
        <h1>Seu currículo, otimizado para a vaga certa.</h1>
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
              {USE_MOCK_DATA && (
                <span className="test-badge" title="Usando dados de teste local">
                  Dados de Teste
                </span>
              )}
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
