const runtimeDefaultApiBaseUrl =
  window.location.hostname === 'localhost' && window.location.port === '5173'
    ? 'http://localhost:8080'
    : window.location.origin;

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL?.trim() || runtimeDefaultApiBaseUrl).replace(/\/$/, '');
const REQUEST_TIMEOUT_MS = 60_000;

export async function optimizeCv(cvFile, jobSource) {
  const formData = new FormData();
  formData.append('cvFile', cvFile);
  formData.append('jobSource', jobSource);

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  let response;
  try {
    response = await fetch(`${API_BASE_URL}/api/optimize`, {
      method: 'POST',
      body: formData,
      signal: controller.signal
    });
  } catch (error) {
    if (error?.name === 'AbortError') {
      throw new Error('A solicitação excedeu o tempo limite. Tente novamente.');
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }

  if (!response.ok) {
    let message = 'Não foi possível otimizar o currículo no momento.';
    try {
      const errorBody = await response.json();
      message = errorBody.message || message;
    } catch {
      // Mantém a mensagem padrão se a API não retornar JSON.
    }
    throw new Error(message);
  }

  return response.json();
}
