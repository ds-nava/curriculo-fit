function progressColor(score) {
  if (score < 50) return 'var(--danger)';
  if (score <= 75) return 'var(--warning)';
  return 'var(--success)';
}

export default function FitAnalysis({ analise }) {
  const score = analise?.score_compatibilidade ?? 0;

  return (
    <section className="panel fade-in">
      <h2>Análise de Compatibilidade</h2>

      <div className="score-wrap">
        <div className="score-meta">
          <strong>Score</strong>
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
        <section>
          <h3>✅ Pontos Fortes</h3>
          <ul>{(analise?.pontos_fortes || []).map((item) => <li key={`pf-${item}`}>{item}</li>)}</ul>
        </section>
        <section>
          <h3>❌ Gaps Críticos</h3>
          <ul>{(analise?.gaps_criticos || []).map((item) => <li key={`gc-${item}`}>{item}</li>)}</ul>
        </section>
        <section>
          <h3>🔎 Keywords Presentes</h3>
          <ul>{(analise?.keywords_presentes || []).map((item) => <li key={`kp-${item}`}>{item}</li>)}</ul>
        </section>
        <section>
          <h3>🧩 Keywords Ausentes</h3>
          <ul>{(analise?.keywords_ausentes || []).map((item) => <li key={`ka-${item}`}>{item}</li>)}</ul>
        </section>
        <section className="full-width">
          <h3>💡 Recomendações</h3>
          <ul>{(analise?.recomendacoes || []).map((item) => <li key={`rc-${item}`}>{item}</li>)}</ul>
        </section>
      </div>
    </section>
  );
}
