import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Legend, Tooltip, ResponsiveContainer } from 'recharts';

function progressColor(score) {
  if (score < 50) return 'var(--danger)';
  if (score <= 75) return 'var(--warning)';
  return 'var(--success)';
}

function statusLabel(status) {
  if (status === 'atende_total') return 'Atende totalmente';
  if (status === 'atende_parcial') return 'Atende parcialmente';
  if (status === 'nao_atende') return 'Nao atende';
  return 'Status nao informado';
}

function formatSubscoresToRadarData(subscores) {
  if (!subscores) return [];
  return [
    {
      categoria: 'Técnica',
      valor: subscores.aderencia_tecnica || 0,
      fullMark: 40
    },
    {
      categoria: 'Responsabilidades',
      valor: subscores.aderencia_responsabilidades || 0,
      fullMark: 25
    },
    {
      categoria: 'Domínio',
      valor: subscores.aderencia_dominio || 0,
      fullMark: 20
    },
    {
      categoria: 'Clareza',
      valor: subscores.clareza_comunicacao || 0,
      fullMark: 15
    }
  ];
}

export default function FitAnalysis({ analise }) {
  const score = analise?.score_compatibilidade ?? 0;
  const subscores = analise?.subscores;
  const radarData = formatSubscoresToRadarData(subscores);
  const recomendacoesDiretas = (analise?.recomendacoes || []).filter(Boolean);
  const diagnostico = analise?.diagnostico_estrutural;
  const estruturaAtual = diagnostico?.estrutura_atual_adequada === true
    ? 'Adequada'
    : diagnostico?.estrutura_atual_adequada === false
      ? 'Nao adequada'
      : 'Nao informada';

  const cobertura = analise?.cobertura_requisitos || [];
  const coberturaRelevante = cobertura.slice(0, 3);

  return (
    <section className="panel fade-in">
      <h3>Análise de Compatibilidade</h3>

      <div className="score-wrap">
        <div className="score-meta">
          <strong>Score Geral</strong>
          <span>{score}/100</span>
        </div>
        <div className="score-track">
          <div
            className="score-fill"
            style={{ width: `${Math.max(0, Math.min(100, score))}%`, backgroundColor: progressColor(score) }}
          />
        </div>
      </div>

      {radarData.length > 0 && (
        <div className="radar-container">
          <h4>Análise Detalhada (Subscores)</h4>
          <ResponsiveContainer width="100%" height={300}>
            <RadarChart data={radarData} margin={{ top: 20, right: 30, bottom: 20, left: 30 }}>
              <PolarGrid stroke="#e0e0e0" />
              <PolarAngleAxis dataKey="categoria" />
              <PolarRadiusAxis angle={90} domain={[0, 40]} />
              <Radar 
                name="Pontuação" 
                dataKey="valor" 
                stroke="#3b82f6" 
                fill="#3b82f6" 
                fillOpacity={0.6} 
              />
              <Tooltip 
                formatter={(value) => value.toFixed(1)}
                contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.95)', border: '1px solid #ccc', borderRadius: '4px' }}
              />
              <Legend />
            </RadarChart>
          </ResponsiveContainer>
          <div className="subscores-summary">
            <ul>
              <li>Aderência técnica: <strong>{subscores?.aderencia_tecnica ?? 0}/40</strong></li>
              <li>Aderência de responsabilidades: <strong>{subscores?.aderencia_responsabilidades ?? 0}/25</strong></li>
              <li>Aderência de domínio: <strong>{subscores?.aderencia_dominio ?? 0}/20</strong></li>
              <li>Clareza de comunicação: <strong>{subscores?.clareza_comunicacao ?? 0}/15</strong></li>
            </ul>
          </div>
        </div>
      )}

      <p className="summary">{analise?.resumo}</p>

      <div className="analysis-grid">
        <section className="analysis-card">
          <h4>Pontos Fortes</h4>
          <ul>{(analise?.pontos_fortes || []).map((item) => <li key={`pf-${item}`}>{item}</li>)}</ul>
        </section>
        <section className="analysis-card">
          <h4>Gaps Críticos</h4>
          <ul>{(analise?.gaps_criticos || []).map((item) => <li key={`gc-${item}`}>{item}</li>)}</ul>
        </section>
        <section className="analysis-card">
          <h4>Keywords Presentes</h4>
          <ul>{(analise?.keywords_presentes || []).map((item) => <li key={`kp-${item}`}>{item}</li>)}</ul>
        </section>
        <section className="analysis-card">
          <h4>Keywords Ausentes</h4>
          <ul>{(analise?.keywords_ausentes || []).map((item) => <li key={`ka-${item}`}>{item}</li>)}</ul>
        </section>
        <section className="analysis-card full-width">
          <h4>Recomendações</h4>
          {recomendacoesDiretas.length > 0 && (
            <div className="recommendation-block">
              <h5>Plano de Ação</h5>
              <ol>
                {recomendacoesDiretas.map((item, index) => <li key={`rc-${index}-${item}`}>{item}</li>)}
              </ol>
            </div>
          )}

          {diagnostico && (
            <div className="recommendation-block">
              <h5>Diagnóstico Estrutural</h5>
              <p><strong>Estrutura atual:</strong> {estruturaAtual}</p>
              {diagnostico?.motivo_estrutural && <p>{diagnostico.motivo_estrutural}</p>}

              {(diagnostico?.secoes_a_reordenar || []).length > 0 && (
                <p><strong>Reordenar:</strong> {diagnostico.secoes_a_reordenar.join(', ')}</p>
              )}
              {(diagnostico?.secoes_a_comprimir || []).length > 0 && (
                <p><strong>Comprimir:</strong> {diagnostico.secoes_a_comprimir.join(', ')}</p>
              )}
              {(diagnostico?.secoes_a_expandir || []).length > 0 && (
                <p><strong>Expandir:</strong> {diagnostico.secoes_a_expandir.join(', ')}</p>
              )}
              {(diagnostico?.novo_outline_sugerido || []).length > 0 && (
                <p><strong>Novo outline:</strong> {diagnostico.novo_outline_sugerido.join(' > ')}</p>
              )}
            </div>
          )}

          {coberturaRelevante.length > 0 && (
            <div className="recommendation-block">
              <h5>Cobertura dos Requisitos (Top 3)</h5>
              <ul>
                {coberturaRelevante.map((item, index) => (
                  <li key={`cv-${index}-${item?.requisito || 'req'}`}>
                    <strong>{item?.requisito || 'Requisito nao identificado'}</strong>: {statusLabel(item?.status)}
                    <br />
                    <span>{item?.evidencia_curriculo || 'Evidencia nao informada'}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {recomendacoesDiretas.length === 0 && !diagnostico && coberturaRelevante.length === 0 && (
            <ul>
              <li>Sem recomendações disponíveis.</li>
            </ul>
          )}
        </section>
      </div>
    </section>
  );
}
