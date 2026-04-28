import { useEffect, useState } from 'react';
import Uploader from '../components/Uploader';
import CVPreview from '../components/CVPreview';
import FitAnalysis from '../components/FitAnalysis';
import { optimizeCv, validateGroqKey } from '../services/api';
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
  const [keyInput, setKeyInput] = useState('');
  const [activeUserKey, setActiveUserKey] = useState('');
  const [keyStatus, setKeyStatus] = useState('idle');
  const [keyFeedback, setKeyFeedback] = useState('');
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
        console.log('🚀 MODO PRODUÇÃO: Chamando API de IA');
        data = await optimizeCv(cvFile, jobSource, activeUserKey);
      }
      
      setResult(data);
      setActiveTab('curriculo');
      setStatus('success');
    } catch (err) {
      setStatus('error');
      setError(err.message || 'Falha ao otimizar currículo.');
    }
  }

  async function handleValidateKey() {
    try {
      setKeyStatus('loading');
      setKeyFeedback('');

      const normalizedKey = keyInput.trim();
      if (!normalizedKey) {
        setKeyStatus('error');
        setKeyFeedback('Cole sua API key Groq para validar.');
        return;
      }

      await validateGroqKey(normalizedKey);
      setActiveUserKey(normalizedKey);
      setKeyInput('');
      setKeyStatus('success');
      setKeyFeedback('Chave validada com sucesso. As próximas otimizações usarão sua chave.');
    } catch (err) {
      setKeyStatus('error');
      setKeyFeedback(err.message || 'Não foi possível validar a API key.');
    }
  }

  function handleRemoveKey() {
    setActiveUserKey('');
    setKeyInput('');
    setKeyStatus('idle');
    setKeyFeedback('');
  }

  function maskKey(key) {
    if (!key) return '';
    const tail = key.slice(-4);
    return `••••••••••••${tail}`;
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
        <section className="panel byok-panel fade-in">
          <div className="panel-header">
            <div>
              <h3>API key Groq do usuário (opcional)</h3>
              <p className="panel-subtitle">
                Sua chave fica só em memória desta aba e não é salva em banco, arquivo ou storage.
              </p>
            </div>
            {activeUserKey && <span className="result-chip">Usando sua chave</span>}
          </div>

          <div className="byok-grid">
            <input
              type="password"
              className="byok-input"
              value={keyInput}
              onChange={(event) => setKeyInput(event.target.value)}
              placeholder={activeUserKey ? `Chave ativa: ${maskKey(activeUserKey)}` : 'Cole sua API key Groq'}
              autoComplete="off"
              spellCheck={false}
            />

            <div className="byok-actions">
              <button type="button" className="primary-button" onClick={handleValidateKey} disabled={keyStatus === 'loading'}>
                {keyStatus === 'loading' ? 'Validando...' : 'Validar e usar'}
              </button>
              {activeUserKey && (
                <button type="button" className="ghost-button" onClick={handleRemoveKey}>
                  Remover chave
                </button>
              )}
            </div>
          </div>

          {keyStatus === 'error' && keyFeedback && <div className="error-box">{keyFeedback}</div>}
          {keyStatus === 'success' && keyFeedback && <div className="success-box">{keyFeedback}</div>}
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
