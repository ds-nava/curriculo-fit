const runtimeDefaultApiBaseUrl =
  window.location.hostname === 'localhost'
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
    throw new Error(await readErrorMessage(response));
  }

  return response.json();
}

async function readErrorMessage(response) {
  const fallbackMessage = response.status
    ? `Não foi possível otimizar o currículo no momento. (${response.status}${response.statusText ? ` ${response.statusText}` : ''})`
    : 'Não foi possível otimizar o currículo no momento.';

  const contentType = response.headers.get('content-type') || '';

  if (contentType.includes('application/json')) {
    try {
      const errorBody = await response.json();
      return errorBody?.message || errorBody?.detail || errorBody?.error || fallbackMessage;
    } catch {
      return fallbackMessage;
    }
  }

  try {
    const rawBody = (await response.text()).trim();
    if (!rawBody) {
      return fallbackMessage;
    }

    if (rawBody.startsWith('<')) {
      return fallbackMessage;
    }

    try {
      const parsedBody = JSON.parse(rawBody);
      return parsedBody?.message || parsedBody?.detail || parsedBody?.error || rawBody || fallbackMessage;
    } catch {
      return rawBody;
    }
  } catch {
    return fallbackMessage;
  }
}
