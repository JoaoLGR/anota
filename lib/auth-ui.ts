export function getSafeNext(value: string | null | undefined, fallback = "/") {
  if (!value || !value.startsWith("/") || value.startsWith("//"))
    return fallback;
  return value;
}

export function getAuthErrorMessage(error: {
  status?: number;
  code?: string;
  message?: string;
}) {
  if (error.status === 429 || error.code === "over_request_rate_limit")
    return "Muitas tentativas. Aguarde alguns minutos e tente novamente.";
  if (error.code === "invalid_credentials") return "E-mail ou senha inválidos.";
  if (error.code === "email_not_confirmed")
    return "Confirme seu e-mail antes de entrar.";
  if (error.code === "user_not_found")
    return "Não encontramos uma conta com este e-mail.";
  if (error.message?.toLowerCase().includes("network"))
    return "Não foi possível conectar ao servidor. Verifique sua internet.";
  return "Não foi possível concluir o acesso. Tente novamente.";
}
