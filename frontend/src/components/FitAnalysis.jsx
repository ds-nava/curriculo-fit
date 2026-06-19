import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Legend, Tooltip, ResponsiveContainer } from 'recharts';
import { CheckCircle2, AlertTriangle, Hash, XCircle, Info, Lightbulb, ClipboardList } from 'lucide-react';

function progressColor(score) {
  if (score < 50) return '#ef4444';
  if (score <= 75) return '#f59e0b';
  return '#22c55e';
}

function statusLabel(status) {
  if (status === 'atende_total') return 'Atende totalmente';
  if (status === 'atende_parcial') return 'Atende parcialmente';
  if (status === 'nao_atende') return 'Nao atende';
  return 'Status nao informado';
}

function statusClass(status) {
  if (status === 'atende_total') return 'bg-green-200 text-green-900 dark:bg-green-900/40 dark:text-green-300';
  if (status === 'atende_parcial') return 'bg-amber-200 text-amber-900 dark:bg-amber-900/40 dark:text-amber-300';
  if (status === 'nao_atende') return 'bg-red-200 text-red-900 dark:bg-red-900/40 dark:text-red-300';
  return 'bg-neutral-200 text-neutral-700';
}

function formatSubscoresToRadarData(subscores) {
  if (!subscores) return [];
  return [
    {
      categoria: 'Técnica',
      valor: (subscores.aderencia_tecnica / 40) * 100 || 0,
      valor_bruto: subscores.aderencia_tecnica || 0,
      max_valor: 40
    },
    {
      categoria: 'Responsabilidades',
      valor: (subscores.aderencia_responsabilidades / 25) * 100 || 0,
      valor_bruto: subscores.aderencia_responsabilidades || 0,
      max_valor: 25
    },
    {
      categoria: 'Domínio',
      valor: (subscores.aderencia_dominio / 20) * 100 || 0,
      valor_bruto: subscores.aderencia_dominio || 0,
      max_valor: 20
    },
    {
      categoria: 'Clareza',
      valor: (subscores.clareza_comunicacao / 15) * 100 || 0,
      valor_bruto: subscores.clareza_comunicacao || 0,
      max_valor: 15
    }
  ];
}

const subscoreExplanations = {
  aderencia_tecnica: 'Avalia se o currículo menciona as tecnologias, ferramentas e habilidades técnicas exigidas na vaga.',
  aderencia_responsabilidades: 'Analisa se as responsabilidades anteriores alinham com as responsabilidades da posição.',
  aderencia_dominio: 'Verifica se o currículo demonstra experiência no domínio/setor da vaga (ex: fintech, saúde).',
  clareza_comunicacao: 'Avalia a qualidade da comunicação: estrutura, objetividade e organização das informações.'
};

export default function FitAnalysis({ analise }) {
  const score = analise?.score_compatibilidade ?? 0;
  const subscores = analise?.subscores;
  const radarData = formatSubscoresToRadarData(subscores);
  const recomendacoesDiretas = (analise?.recomendacoes || []).filter(Boolean);
  const cobertura = analise?.cobertura_requisitos || [];
  const coberturaRelevante = cobertura.slice(0, 3);

  return (
    <section className="animate-fade-up space-y-5">
      <h3 className="text-lg font-extrabold text-nb-ink dark:text-neutral-100 m-0">
        Análise de Compatibilidade
      </h3>

      {/* Score Bar */}
      <div className="border-2 border-nb-border dark:border-neutral-500 rounded-brutal p-5 bg-nb-bg dark:bg-neutral-800">
        <div className="flex justify-between items-end mb-3">
          <div>
            <span className="text-sm font-bold text-nb-muted dark:text-neutral-400 uppercase tracking-wider">
              Score Geral
            </span>
            <div className="text-4xl font-extrabold text-nb-ink dark:text-neutral-100 leading-none mt-1">
              {score}
              <span className="text-lg font-bold text-nb-muted dark:text-neutral-400">/100</span>
            </div>
          </div>
        </div>
        <div className="h-4 rounded-full bg-white dark:bg-neutral-700 border-2 border-nb-border dark:border-neutral-500 overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-700 ease-out"
            style={{
              width: `${Math.max(0, Math.min(100, score))}%`,
              backgroundColor: progressColor(score)
            }}
          />
        </div>
      </div>

      {/* Radar Chart */}
      {radarData.length > 0 && (
        <div className="nb-card p-5">
          <h4 className="text-base font-extrabold text-nb-ink dark:text-neutral-100 mb-4 m-0">
            Análise Detalhada (Subscores)
          </h4>
          <ResponsiveContainer width="100%" height={300}>
            <RadarChart data={radarData} margin={{ top: 20, right: 30, bottom: 20, left: 30 }}>
              <PolarGrid stroke="#d1d5db" />
              <PolarAngleAxis dataKey="categoria" tick={{ fontSize: 13, fontWeight: 600, fill: '#6b7280' }} />
              <PolarRadiusAxis angle={90} domain={[0, 100]} tick={false} />
              <Radar
                name="Pontuação (%)"
                dataKey="valor"
                stroke="#84a2ca"
                fill="#84a2ca"
                fillOpacity={0.3}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#ffffff',
                  border: '2px solid #000000',
                  borderRadius: '6px',
                  boxShadow: '4px 4px 0px #000000',
                  fontWeight: 600,
                }}
                formatter={(value, name, props) => {
                  const item = props.payload;
                  return [`${value.toFixed(1)}% (${item.valor_bruto}/${item.max_valor})`, name];
                }}
                labelStyle={{ color: '#1a1a1a', fontWeight: 700, fontSize: '0.9rem' }}
              />
              <Legend />
            </RadarChart>
          </ResponsiveContainer>

          {/* Subscores Detail */}
          <div className="border-t-2 border-dashed border-nb-border/20 dark:border-neutral-600 mt-4 pt-4">
            <ul className="space-y-3 list-none p-0 m-0">
              {[
                { key: 'aderencia_tecnica', label: 'Aderência técnica', max: 40 },
                { key: 'aderencia_responsabilidades', label: 'Aderência de responsabilidades', max: 25 },
                { key: 'aderencia_dominio', label: 'Aderência de domínio', max: 20 },
                { key: 'clareza_comunicacao', label: 'Clareza de comunicação', max: 15 },
              ].map(({ key, label, max }) => (
                <li key={key} className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2 text-nb-ink dark:text-neutral-200 font-medium">
                    {label}
                    <span
                      className="inline-flex items-center justify-center w-[18px] h-[18px] rounded-full bg-nb-accent text-white text-[10px] font-bold cursor-help"
                      title={subscoreExplanations[key]}
                    >
                      ?
                    </span>
                  </span>
                  <span className="font-bold text-nb-ink dark:text-neutral-100">
                    {subscores?.[key] ?? 0}/{max}{' '}
                    <span className="text-nb-muted dark:text-neutral-400 font-medium">
                      ({((subscores?.[key] || 0) / max * 100).toFixed(0)}%)
                    </span>
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* Summary */}
      {analise?.resumo && (
        <p className="text-nb-muted dark:text-neutral-400 text-sm leading-relaxed">
          {analise.resumo}
        </p>
      )}

      {/* Analysis Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Pontos Fortes */}
        <div className="nb-card p-5 border-l-4 border-l-nb-success animate-fade-up stagger-1">
          <h4 className="flex items-center gap-2 text-sm font-extrabold text-nb-ink dark:text-neutral-100 mb-3 m-0">
            <CheckCircle2 className="w-5 h-5 text-nb-success" />
            Pontos Fortes
          </h4>
          <ul className="space-y-2 list-none p-0 m-0">
            {(analise?.pontos_fortes || []).map((item) => (
              <li key={`pf-${item}`} className="flex items-start gap-2 text-sm text-nb-ink dark:text-neutral-200">
                <span className="text-nb-success font-bold mt-0.5">→</span>
                {item}
              </li>
            ))}
          </ul>
        </div>

        {/* Gaps Críticos */}
        <div className="nb-card p-5 border-l-4 border-l-nb-danger animate-fade-up stagger-2">
          <h4 className="flex items-center gap-2 text-sm font-extrabold text-nb-ink dark:text-neutral-100 mb-3 m-0">
            <AlertTriangle className="w-5 h-5 text-nb-danger" />
            Gaps Críticos
          </h4>
          <ul className="space-y-2 list-none p-0 m-0">
            {(analise?.gaps_criticos || []).map((item) => (
              <li key={`gc-${item}`} className="flex items-start gap-2 text-sm text-nb-ink dark:text-neutral-200">
                <span className="text-nb-danger font-bold mt-0.5">⚠</span>
                {item}
              </li>
            ))}
          </ul>
        </div>

        {/* Keywords Presentes */}
        <div className="nb-card p-5 border-l-4 border-l-green-400 animate-fade-up stagger-3">
          <h4 className="flex items-center gap-2 text-sm font-extrabold text-nb-ink dark:text-neutral-100 mb-3 m-0">
            <Hash className="w-5 h-5 text-green-500" />
            Keywords Presentes
          </h4>
          <div className="flex flex-wrap gap-2">
            {(analise?.keywords_presentes || []).map((item) => (
              <span
                key={`kp-${item}`}
                className="inline-flex px-3 py-1 text-xs font-bold border-2 border-nb-border dark:border-neutral-500 rounded-brutal shadow-brutal-sm bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300"
              >
                {item}
              </span>
            ))}
          </div>
        </div>

        {/* Keywords Ausentes */}
        <div className="nb-card p-5 border-l-4 border-l-red-400 animate-fade-up stagger-4">
          <h4 className="flex items-center gap-2 text-sm font-extrabold text-nb-ink dark:text-neutral-100 mb-3 m-0">
            <XCircle className="w-5 h-5 text-red-500" />
            Keywords Ausentes
          </h4>
          <div className="flex flex-wrap gap-2">
            {(analise?.keywords_ausentes || []).map((item) => (
              <span
                key={`ka-${item}`}
                className="inline-flex px-3 py-1 text-xs font-bold border-2 border-nb-border dark:border-neutral-500 rounded-brutal shadow-brutal-sm bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300"
              >
                {item}
              </span>
            ))}
          </div>
        </div>

        {/* Recomendações (full width) */}
        <div className="nb-card p-5 md:col-span-2 animate-fade-up stagger-5">
          <h4 className="flex items-center gap-2 text-sm font-extrabold text-nb-ink dark:text-neutral-100 mb-4 m-0">
            <Lightbulb className="w-5 h-5 text-nb-warning" />
            Recomendações
          </h4>

          {recomendacoesDiretas.length > 0 && (
            <div className="bg-amber-50/50 dark:bg-amber-900/10 border-l-4 border-l-nb-warning rounded-brutal p-4 mb-4">
              <h5 className="flex items-center gap-2 font-bold text-sm text-nb-ink dark:text-neutral-100 mb-3 m-0">
                <Lightbulb className="w-4 h-4 text-nb-warning" />
                Plano de Ação
              </h5>
              <ul className="space-y-2 list-none p-0 m-0">
                {recomendacoesDiretas.map((item, index) => (
                  <li key={`rc-${index}-${item}`} className="text-sm text-nb-ink dark:text-neutral-200 pl-4 relative before:content-['•'] before:absolute before:left-0 before:font-bold before:text-nb-warning">
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {coberturaRelevante.length > 0 && (
            <div className="bg-nb-bg/50 dark:bg-neutral-800 border-l-4 border-l-nb-accent rounded-brutal p-4">
              <h5 className="flex items-center gap-2 font-bold text-sm text-nb-ink dark:text-neutral-100 mb-3 m-0">
                <ClipboardList className="w-4 h-4 text-nb-accent" />
                Cobertura dos Requisitos
              </h5>
              <div className="space-y-3">
                {coberturaRelevante.map((item, index) => (
                  <div key={`cv-${index}-${item?.requisito || 'req'}`} className="space-y-1">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <span className="font-bold text-sm text-nb-ink dark:text-neutral-100">
                        {item?.requisito || 'Requisito nao identificado'}
                      </span>
                      <span
                        className={`inline-flex px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider border-2 border-nb-border dark:border-neutral-500 rounded-brutal ${statusClass(item?.status)}`}
                      >
                        {statusLabel(item?.status)}
                      </span>
                    </div>
                    <p className="text-xs text-nb-muted dark:text-neutral-400 m-0">
                      <strong>Evidência:</strong> {item?.evidencia_curriculo || 'Nao identificada'}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {recomendacoesDiretas.length === 0 && coberturaRelevante.length === 0 && (
            <div className="border-2 border-dashed border-nb-border/30 dark:border-neutral-600 rounded-brutal p-6 text-center text-nb-muted dark:text-neutral-400 text-sm">
              Sem recomendações disponíveis.
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
