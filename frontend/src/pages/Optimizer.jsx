import { useState } from 'react';
import Uploader from '../components/Uploader';
import CVPreview from '../components/CVPreview';
import FitAnalysis from '../components/FitAnalysis';
import { optimizeCv, validateGroqKey } from '../services/api';
import { USE_MOCK_DATA, getMockDelay } from '../testConfig';
import { mockAnalysisResponse } from '../mockData';

export default function Optimizer() {
  const [status, setStatus] = useState('idle');
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);
  const [activeTab, setActiveTab] = useState('curriculo');
  const [keyInput, setKeyInput] = useState('');
  const [activeUserKey, setActiveUserKey] = useState('');
  const [keyStatus, setKeyStatus] = useState('idle');
  const [keyFeedback, setKeyFeedback] = useState('');

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
