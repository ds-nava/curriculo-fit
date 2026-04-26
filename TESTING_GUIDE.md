# Guia de Testes Frontend: Modo Local e Modo Produção

## Objetivo

Este guia descreve como alternar entre:

- modo local, com dados mock, para desenvolvimento de interface;
- modo produção, com chamada real da API de IA, para validação funcional.

## Visão Geral

| Modo | Quando usar | Benefícios | Trade-offs |
|------|-------------|------------|------------|
| Local (mock) | Ajustes de UI/UX, layout e interação | Rapidez, previsibilidade, custo zero | Não valida a qualidade real da IA |
| Produção (IA) | Teste de integração ponta a ponta | Resultado real da análise | Maior latência e consumo de API |

## Como Alternar

Arquivo: `frontend/src/testConfig.js`

```javascript
// true: usa dados mock (sem chamada de IA)
export const USE_MOCK_DATA = true;

// false: usa API real de IA
export const USE_MOCK_DATA = false;
```

Basta alterar o valor de `USE_MOCK_DATA` e recarregar a aplicação.

## Fluxo de Execução

### Modo Local (`USE_MOCK_DATA = true`)

1. Usuário aciona a otimização.
2. O frontend identifica o modo local.
3. É aplicado um atraso simulado (`getMockDelay`).
4. A resposta vem de `mockAnalysisResponse` em `mockData.js`.
5. A interface renderiza o resultado sem chamar backend/IA.
6. O indicador visual de teste é exibido no cabeçalho do resultado.

### Modo Produção (`USE_MOCK_DATA = false`)

1. Usuário aciona a otimização.
2. O frontend identifica o modo produção.
3. O arquivo e a descrição da vaga são enviados para o backend.
4. O backend executa o processamento com IA.
5. O frontend recebe `cv_otimizado` e `analise` reais.
6. A interface renderiza o resultado sem indicador de teste.

## Quando Usar Cada Modo

Use modo local para:

- ajustes de estilo (`styles.css`);
- validação de comportamento visual de componentes;
- refinamento de textos, tooltips e organização da tela;
- ciclos rápidos de teste durante desenvolvimento.

Use modo produção para:

- validar integração frontend + backend + IA;
- confirmar formato real da resposta;
- avaliar qualidade do conteúdo gerado;
- testes finais antes de publicação.

## Diferença Entre Dados Mock e Dados Reais

Dados mock (`mockData.js`):

- controlados e determinísticos;
- ideais para repetição de testes visuais;
- não variam entre execuções.

Dados reais (API):

- gerados dinamicamente pela IA;
- podem variar entre chamadas;
- necessários para validação funcional completa.

## Estrutura Relevante

```text
frontend/
  src/
    testConfig.js      # alterna entre local e produção
    mockData.js        # resposta mock usada no modo local
    pages/
      Optimizer.jsx    # lógica de seleção entre mock e API
    components/
      FitAnalysis.jsx  # renderização da análise
```

## Procedimento Recomendado

1. Desenvolvimento de interface:
   1. Defina `USE_MOCK_DATA = true`.
   2. Faça ajustes visuais e de interação.
   3. Teste rapidamente em múltiplas iterações.
2. Validação de integração:
   1. Defina `USE_MOCK_DATA = false`.
   2. Execute teste com currículo e vaga reais.
   3. Verifique consistência do resultado e tratamento de erros.

## Boas Práticas

- Mantenha o `mockData.js` atualizado com o contrato atual da API.
- Antes de merge/deploy, confirme que o valor de `USE_MOCK_DATA` está correto para o ambiente.
- Para depuração, observe os logs de modo local/produção no console.
- Considere criar múltiplos cenários mock (ex.: resposta vazia, erro, score alto/baixo).

## Perguntas Frequentes

Preciso remover `mockData.js` em produção?

- Não. O arquivo pode permanecer no projeto; o comportamento depende de `USE_MOCK_DATA`.

O que fazer se o backend mudar o formato da resposta?

- Atualize `mockData.js` para refletir o novo contrato e reteste em modo local.
