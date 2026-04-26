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
  // Converter para porcentagem (max 100%)
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
              <PolarRadiusAxis angle={90} domain={[0, 100]} tick={false} />
              <Radar 
                name="Pontuação (%)" 
                dataKey="valor" 
                stroke="#3b82f6" 
                fill="#3b82f6" 
                fillOpacity={0.6} 
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'rgba(255, 255, 255, 0.98)', 
                  border: '1px solid #e0e0e0', 
                  borderRadius: '6px',
                  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)'
                }}
                formatter={(value, name, props) => {
                  const item = props.payload;
                  return [`${value.toFixed(1)}% (${item.valor_bruto}/${item.max_valor})`, name];
                }}
                labelStyle={{ color: 'var(--ink)', fontWeight: 600, fontSize: '0.9rem' }}
              />
              <Legend />
            </RadarChart>
          </ResponsiveContainer>
          <div className="subscores-summary">
            <ul>
              <li>
                <span className="criteria-label">
                  Aderência técnica
                  <span className="info-icon" data-explanation="Avalia se o currículo menciona as tecnologias, ferramentas e habilidades técnicas exigidas na vaga. Inclui linguagens de programação, frameworks, bibliotecas e competências específicas do domínio.">?</span>
                </span>
                <strong>{subscores?.aderencia_tecnica ?? 0}/40</strong> ({((subscores?.aderencia_tecnica || 0) / 40 * 100).toFixed(1)}%)
              </li>
              <li>
                <span className="criteria-label">
                  Aderência de responsabilidades
                  <span className="info-icon" data-explanation="Analisa se as responsabilidades anteriores descrevem experiências que alinham com as responsabilidades da posição. Verifica se o candidato tem histórico em atividades similares.">?</span>
                </span>
                <strong>{subscores?.aderencia_responsabilidades ?? 0}/25</strong> ({((subscores?.aderencia_responsabilidades || 0) / 25 * 100).toFixed(1)}%)
              </li>
              <li>
                <span className="criteria-label">
                  Aderência de domínio
                  <span className="info-icon" data-explanation="Verifica se o currículo demonstra experiência no domínio/setor da vaga (ex: fintech, e-commerce, saúde). Busca por projetos, empresas ou contextos similares.">?</span>
                </span>
                <strong>{subscores?.aderencia_dominio ?? 0}/20</strong> ({((subscores?.aderencia_dominio || 0) / 20 * 100).toFixed(1)}%)
              </li>
              <li>
                <span className="criteria-label">
                  Clareza de comunicação
                  <span className="info-icon" data-explanation="Avalia a qualidade da comunicação no currículo: estrutura, objetividade, uso de termos profissionais e organização das informações. Um currículo claro facilita o entendimento.">?</span>
                </span>
                <strong>{subscores?.clareza_comunicacao ?? 0}/15</strong> ({((subscores?.clareza_comunicacao || 0) / 15 * 100).toFixed(1)}%)
              </li>
            </ul>
          </div>
        </div>
      )}

      <p className="summary">{analise?.resumo}</p>

      <div className="analysis-grid">
        <section className="analysis-card strengths">
          <h4>Pontos Fortes</h4>
          <ul>{(analise?.pontos_fortes || []).map((item) => <li key={`pf-${item}`}>{item}</li>)}</ul>
        </section>
        <section className="analysis-card gaps">
          <h4>Gaps Críticos</h4>
          <ul>{(analise?.gaps_criticos || []).map((item) => <li key={`gc-${item}`}>{item}</li>)}</ul>
        </section>
        <section className="analysis-card present-keywords">
          <h4>Keywords Presentes</h4>
          <ul>{(analise?.keywords_presentes || []).map((item) => <li key={`kp-${item}`}>{item}</li>)}</ul>
        </section>
        <section className="analysis-card absent-keywords">
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
            <div className="recommendation-block diagnostic">
              <h5>Diagnóstico Estrutural</h5>
              <p><strong>Estrutura atual:</strong> <span style={
                diagnostico?.estrutura_atual_adequada === true 
                  ? { color: 'var(--success)', fontWeight: 500 }
                  : diagnostico?.estrutura_atual_adequada === false
                    ? { color: 'var(--danger)', fontWeight: 500 }
                    : {}
              }>{estruturaAtual}</span></p>
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
            <div className="recommendation-block cobertura">
              <h5>Cobertura dos Requisitos (Top 3)</h5>
              <div>
                {coberturaRelevante.map((item, index) => (
                  <div key={`cv-${index}-${item?.requisito || 'req'}`} className="requirement-item">
                    <div className="requirement-header">
                      <span className="requirement-title">{item?.requisito || 'Requisito nao identificado'}</span>
                      <span className={`requirement-status ${item?.status === 'atende_total' ? 'total' : item?.status === 'atende_parcial' ? 'parcial' : 'nao-atende'}`}>
                        {statusLabel(item?.status)}
                      </span>
                    </div>
                    <p className="requirement-evidence">{item?.evidencia_curriculo || 'Evidencia nao informada'}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {recomendacoesDiretas.length === 0 && !diagnostico && coberturaRelevante.length === 0 && (
            <div className="no-recommendations">
              <p>Sem recomendações disponíveis.</p>
            </div>
          )}
        </section>
      </div>
    </section>
  );
}
