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

export default function FitAnalysis({ analise }) {
  const score = analise?.score_compatibilidade ?? 0;
  const subscores = analise?.subscores;
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

        <section className="analysis-card full-width">
          <h4>Subscores</h4>
          <ul>
            <li>Aderência técnica: {subscores?.aderencia_tecnica ?? 0}/40</li>
            <li>Aderência de responsabilidades: {subscores?.aderencia_responsabilidades ?? 0}/25</li>
            <li>Aderência de domínio: {subscores?.aderencia_dominio ?? 0}/20</li>
            <li>Clareza de comunicação: {subscores?.clareza_comunicacao ?? 0}/15</li>
          </ul>
        </section>
      </div>
    </section>
  );
}
