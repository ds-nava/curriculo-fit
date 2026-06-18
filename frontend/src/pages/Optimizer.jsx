import { useEffect, useState } from 'react';
import Uploader from '../components/Uploader';
import CVPreview from '../components/CVPreview';
import FitAnalysis from '../components/FitAnalysis';
import { optimizeCv } from '../services/api';
import { USE_MOCK_DATA, getMockDelay } from '../testConfig';
import { mockAnalysisResponse } from '../mockData';

const LOADING_STEPS = [
  'Etapa 1/7: Extraindo texto do currículo',
  'Etapa 2/7: Coletando e normalizando dados da vaga',
  'Etapa 3/7: Montando instruções para a IA',
  'Etapa 4/7: Gerando currículo otimizado',
  'Etapa 5/7: Validando qualidade e consistência',
  'Etapa 6/7: Ajustando análise estrutural e cobertura',
  'Etapa 7/7: Finalizando resposta para exibição'
];

export default function Optimizer() {
  const [status, setStatus] = useState('idle');
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);
  const [activeTab, setActiveTab] = useState('curriculo');
  const [provider, setProvider] = useState('gemini');
  const [loadingStepIndex, setLoadingStepIndex] = useState(0);

  useEffect(() => {
    if (status !== 'loading') {
      setLoadingStepIndex(0);
      return;
    }

    setLoadingStepIndex(0);
    const intervalId = setInterval(() => {
      setLoadingStepIndex((current) => Math.min(current + 1, LOADING_STEPS.length - 1));
    }, 1800);

    return () => clearInterval(intervalId);
  }, [status]);

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
        console.log(`🚀 MODO PRODUÇÃO: Chamando API de IA usando provedor: ${provider}`);
        data = await optimizeCv(cvFile, jobSource, provider);
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

      {!USE_MOCK_DATA && (
        <section className="provider-selector-panel fade-in">
          <div className="provider-selector-header">
            <h3>Provedor de Inteligência Artificial</h3>
            <p>
              Escolha qual provedor processará a otimização utilizando as credenciais seguras do servidor.
            </p>
          </div>
          <div className="provider-toggle-group" role="radiogroup" aria-label="Seletor de Provedor de IA">
            <button
              type="button"
              className={`provider-toggle-button ${provider === 'gemini' ? 'active' : ''}`}
              onClick={() => setProvider('gemini')}
              role="radio"
              aria-checked={provider === 'gemini'}
            >
              Google Gemini
            </button>
            <button
              type="button"
              className={`provider-toggle-button ${provider === 'groq' ? 'active' : ''}`}
              onClick={() => setProvider('groq')}
              role="radio"
              aria-checked={provider === 'groq'}
            >
              Groq (Llama)
            </button>
          </div>
        </section>
      )}

      <section className={status === 'success' && result ? 'workspace two-columns' : 'workspace'}>
        <aside className="workspace-main">
          <Uploader loading={status === 'loading'} onSubmit={handleOptimize} error={error} />
          {status === 'loading' && (
            <section className="panel loading-log fade-in" aria-live="polite" aria-busy="true">
              <h3>Processando sua solicitação</h3>
              <p className="panel-subtitle">{LOADING_STEPS[loadingStepIndex]}</p>
              <ol className="loading-steps">
                {LOADING_STEPS.map((step, index) => {
                  const stepState = index < loadingStepIndex ? 'done' : index === loadingStepIndex ? 'active' : 'pending';
                  return (
                    <li key={step} className={`loading-step ${stepState}`}>
                      <span className="loading-step-dot" aria-hidden="true" />
                      <span>{step}</span>
                    </li>
                  );
                })}
              </ol>
            </section>
          )}
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
