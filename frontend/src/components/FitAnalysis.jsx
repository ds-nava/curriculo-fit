function progressColor(score) {
  if (score < 50) return 'var(--danger)';
  if (score <= 75) return 'var(--warning)';
  return 'var(--success)';
}

function joinList(items) {
  return (items || []).filter(Boolean).join(', ');
}

export default function FitAnalysis({ analise }) {
  const score = analise?.score_compatibilidade ?? 0;
  const subscores = analise?.subscores;
  const feedbackComplementar = [];

  const diagnostico = analise?.diagnostico_estrutural;
  if (diagnostico) {
    feedbackComplementar.push(
      `Estrutura atual: ${diagnostico?.estrutura_atual_adequada === true
        ? 'adequada'
        : diagnostico?.estrutura_atual_adequada === false
          ? 'não adequada'
          : 'não informada'}${diagnostico?.motivo_estrutural ? `. ${diagnostico.motivo_estrutural}` : '.'}`
    );

    const secoesAReordenar = joinList(diagnostico?.secoes_a_reordenar);
    const secoesAComprimir = joinList(diagnostico?.secoes_a_comprimir);
    const secoesAExpandir = joinList(diagnostico?.secoes_a_expandir);
    const novoOutline = joinList(diagnostico?.novo_outline_sugerido);

    if (secoesAReordenar || secoesAComprimir || secoesAExpandir || novoOutline) {
      const trechos = [];
      if (secoesAReordenar) trechos.push(`reordenar: ${secoesAReordenar}`);
      if (secoesAComprimir) trechos.push(`comprimir: ${secoesAComprimir}`);
      if (secoesAExpandir) trechos.push(`expandir: ${secoesAExpandir}`);
      if (novoOutline) trechos.push(`novo outline: ${novoOutline}`);
      feedbackComplementar.push(`Ajustes estruturais sugeridos: ${trechos.join(' | ')}.`);
    }
  }

  const cobertura = analise?.cobertura_requisitos || [];
  if (cobertura.length > 0) {
    const itensRelevantes = cobertura.slice(0, 3).map((item) => {
      const requisito = item?.requisito || 'Requisito não identificado';
      const status = item?.status || 'status não informado';
      const evidencia = item?.evidencia_curriculo || 'evidência não informada';
      return `${requisito}: ${status} (${evidencia})`;
    });
    feedbackComplementar.push(`Cobertura dos requisitos: ${itensRelevantes.join(' | ')}${cobertura.length > 3 ? ' | ...' : ''}.`);
  }

  const recomendacoes = [
    ...(analise?.recomendacoes || []),
    ...feedbackComplementar,
  ];

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
          <ul>
            {recomendacoes.length > 0
              ? recomendacoes.map((item, index) => <li key={`rc-${index}-${item}`}>{item}</li>)
              : <li>Sem recomendações disponíveis.</li>}
          </ul>
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
