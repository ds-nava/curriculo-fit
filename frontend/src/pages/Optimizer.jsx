import { useEffect, useState } from 'react';
import { Loader2, CheckCircle2, Circle } from 'lucide-react';
import Uploader from '../components/Uploader';
import CVPreview from '../components/CVPreview';
import FitAnalysis from '../components/FitAnalysis';
import Header from '../components/Header';
import Footer from '../components/Footer';
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

  const progressPercent = ((loadingStepIndex + 1) / LOADING_STEPS.length) * 100;

  return (
    <div className="min-h-screen flex flex-col bg-nb-bg dark:bg-neutral-900 transition-colors duration-300">
      <Header />

      <main className="flex-1 w-full max-w-[1220px] mx-auto px-4 md:px-6 py-6 flex flex-col gap-5">
        {/* Hero */}
        <section className="bg-nb-surface dark:bg-neutral-800 border-2 border-nb-border dark:border-neutral-500 rounded-brutal shadow-brutal p-8 md:p-10 animate-fade-up">
          <span className="inline-flex bg-nb-accent text-white font-extrabold text-[10px] px-3 py-1 border-2 border-nb-border dark:border-neutral-500 rounded-brutal shadow-brutal-sm uppercase tracking-wider">
            CurriculoFit
          </span>
          <h1 className="text-3xl md:text-4xl font-extrabold mt-4 mb-2 leading-tight text-nb-ink dark:text-neutral-100">
            Seu currículo, otimizado para a vaga certa.
          </h1>
          <p className="text-nb-muted dark:text-neutral-400 text-lg max-w-2xl m-0">
            Envie o CV, descreva a oportunidade e receba uma versão otimizada com análise objetiva de compatibilidade.
          </p>
        </section>

        {/* Provider Selector */}
        {!USE_MOCK_DATA && (
          <section className="nb-card p-5 animate-fade-up no-print">
            <div className="mb-3">
              <h3 className="text-base font-extrabold text-nb-ink dark:text-neutral-100 m-0">
                Provedor de Inteligência Artificial
              </h3>
              <p className="text-nb-muted dark:text-neutral-400 text-sm mt-1 m-0">
                Escolha qual provedor processará a otimização utilizando as credenciais seguras do servidor.
              </p>
            </div>
            <div
              className="bg-nb-bg dark:bg-neutral-700 border-2 border-nb-border dark:border-neutral-500 rounded-brutal p-1 inline-flex"
              role="radiogroup"
              aria-label="Seletor de Provedor de IA"
            >
              <button
                type="button"
                className={`px-5 py-2 text-sm font-bold rounded-brutal transition-all duration-150 ${
                  provider === 'gemini'
                    ? 'bg-nb-accent text-white border-2 border-nb-border dark:border-neutral-500 shadow-brutal-sm'
                    : 'bg-transparent text-nb-ink dark:text-neutral-300 border-2 border-transparent hover:bg-nb-accent/10'
                }`}
                onClick={() => setProvider('gemini')}
                role="radio"
                aria-checked={provider === 'gemini'}
              >
                Google Gemini
              </button>
              <button
                type="button"
                className={`px-5 py-2 text-sm font-bold rounded-brutal transition-all duration-150 ${
                  provider === 'groq'
                    ? 'bg-nb-accent text-white border-2 border-nb-border dark:border-neutral-500 shadow-brutal-sm'
                    : 'bg-transparent text-nb-ink dark:text-neutral-300 border-2 border-transparent hover:bg-nb-accent/10'
                }`}
                onClick={() => setProvider('groq')}
                role="radio"
                aria-checked={provider === 'groq'}
              >
                Groq (Llama)
              </button>
            </div>
          </section>
        )}

        {/* Workspace */}
        <section className={`grid gap-5 ${status === 'success' && result ? 'grid-cols-1 lg:grid-cols-[minmax(280px,360px)_minmax(0,1fr)]' : ''}`}>
          {/* Left: Uploader + Loading */}
          <aside className="min-w-0">
            <Uploader loading={status === 'loading'} onSubmit={handleOptimize} error={error} />

            {status === 'loading' && (
              <section
                className="nb-card p-5 mt-4 animate-fade-up no-print"
                aria-live="polite"
                aria-busy="true"
              >
                <h3 className="text-base font-extrabold text-nb-ink dark:text-neutral-100 m-0 mb-1">
                  Processando sua solicitação
                </h3>
                <p className="text-nb-muted dark:text-neutral-400 text-sm m-0 mb-4">
                  {LOADING_STEPS[loadingStepIndex]}
                </p>

                {/* Progress bar */}
                <div className="h-3 rounded-full bg-white dark:bg-neutral-700 border-2 border-nb-border dark:border-neutral-500 overflow-hidden mb-4">
                  <div
                    className="bg-nb-accent h-full rounded-full transition-all duration-300 ease-out"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>

                {/* Steps */}
                <ol className="space-y-2 list-none p-0 m-0">
                  {LOADING_STEPS.map((step, index) => {
                    const stepState = index < loadingStepIndex ? 'done' : index === loadingStepIndex ? 'active' : 'pending';
                    return (
                      <li key={step} className={`flex items-center gap-3 text-sm ${
                        stepState === 'active'
                          ? 'font-bold text-nb-ink dark:text-neutral-100'
                          : stepState === 'done'
                            ? 'text-nb-muted dark:text-neutral-400 line-through'
                            : 'text-nb-muted/60 dark:text-neutral-500'
                      }`}>
                        {stepState === 'done' && <CheckCircle2 className="w-4 h-4 text-nb-success flex-shrink-0" />}
                        {stepState === 'active' && <Loader2 className="w-4 h-4 text-nb-accent animate-spin flex-shrink-0" />}
                        {stepState === 'pending' && <Circle className="w-4 h-4 text-nb-muted/40 dark:text-neutral-600 flex-shrink-0" />}
                        <span>{step}</span>
                      </li>
                    );
                  })}
                </ol>
              </section>
            )}
          </aside>

          {/* Right: Results */}
          {status === 'success' && result && (
            <section className="nb-card p-5 animate-fade-up">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-5 no-print">
                <h2 className="text-xl font-extrabold text-nb-ink dark:text-neutral-100 m-0">
                  Resultado da Otimização
                </h2>
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center px-3 py-1 text-xs font-bold border-2 border-nb-border dark:border-neutral-500 rounded-brutal bg-green-200 text-green-900 dark:bg-green-900/40 dark:text-green-300 shadow-brutal-sm uppercase tracking-wider">
                    Concluído
                  </span>
                  {USE_MOCK_DATA && (
                    <span className="inline-flex items-center px-3 py-1 text-xs font-bold border-2 border-nb-border dark:border-neutral-500 rounded-brutal bg-nb-accent/20 text-nb-accent-dark dark:text-nb-accent-light shadow-brutal-sm animate-pulse" title="Usando dados de teste local">
                      Dados de Teste
                    </span>
                  )}
                </div>
              </div>

              {/* Tabs */}
              <div
                className="inline-flex border-2 border-nb-border dark:border-neutral-500 rounded-brutal overflow-hidden mb-5 no-print"
                role="tablist"
                aria-label="Visualização de resultados"
              >
                <button
                  className={`px-6 py-2.5 text-sm font-bold transition-all duration-150 ${
                    activeTab === 'curriculo'
                      ? 'bg-nb-accent text-white'
                      : 'bg-nb-surface dark:bg-neutral-800 text-nb-ink dark:text-neutral-300 hover:bg-nb-bg dark:hover:bg-neutral-700'
                  }`}
                  onClick={() => setActiveTab('curriculo')}
                  type="button"
                >
                  Currículo
                </button>
                <button
                  className={`px-6 py-2.5 text-sm font-bold border-l-2 border-nb-border dark:border-neutral-500 transition-all duration-150 ${
                    activeTab === 'analise'
                      ? 'bg-nb-accent text-white'
                      : 'bg-nb-surface dark:bg-neutral-800 text-nb-ink dark:text-neutral-300 hover:bg-nb-bg dark:hover:bg-neutral-700'
                  }`}
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

      <Footer />
    </div>
  );
}
