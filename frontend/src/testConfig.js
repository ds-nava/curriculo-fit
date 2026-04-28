/**
 * CONFIGURAÇÃO DE MODO TESTE
 * 
 * USE_MOCK_DATA = true  → Testa localmente com dados fake (rápido, sem custos)
 * USE_MOCK_DATA = false → Chama a API real de IA (produção)
 */

export const USE_MOCK_DATA = false; // ← MUDE AQUI PARA ALTERNAR!

export const getMockDelay = () => {
  // Simula latência de rede (faz parecer mais realista)
  return new Promise(resolve => setTimeout(resolve, 1500));
};
