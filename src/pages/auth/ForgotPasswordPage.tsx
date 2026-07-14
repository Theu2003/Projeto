import { useState, FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { Card } from '@/components/Card';
import { FadeIn } from '@/components/FadeIn';
import { apiClient } from '@/services/api';

type Step = 'email' | 'code' | 'password' | 'success';

export function ForgotPasswordPage() {
  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  function clearError() {
    setError('');
    setPasswordError('');
  }

  async function handleSendCode(e: FormEvent) {
    e.preventDefault();
    clearError();
    setIsLoading(true);

    try {
      await apiClient.post('/auth/forgot-password', { email });
      setStep('code');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao enviar código');
    } finally {
      setIsLoading(false);
    }
  }

  async function handleVerifyCode(e: FormEvent) {
    e.preventDefault();
    clearError();
    setIsLoading(true);

    try {
      await apiClient.post('/auth/verify-code', { email, code });
      setStep('password');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Código inválido');
    } finally {
      setIsLoading(false);
    }
  }

  async function handleResetPassword(e: FormEvent) {
    e.preventDefault();
    clearError();

    if (password !== confirmPassword) {
      setPasswordError('Senhas não conferem');
      return;
    }

    if (password.length < 6) {
      setPasswordError('Senha deve ter no mínimo 6 caracteres');
      return;
    }

    setIsLoading(true);

    try {
      await apiClient.post('/auth/reset-password', { email, code, password });
      setStep('success');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao redefinir senha');
    } finally {
      setIsLoading(false);
    }
  }

  function formatCode(value: string) {
    const digits = value.replace(/\D/g, '').slice(0, 6);
    setCode(digits);
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-green-50 dark:from-gray-900 dark:to-gray-800 px-4">
      <div className="w-full max-w-md">
        <FadeIn type="fade-down" duration={600}>
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 mb-4 animate-bounce-gentle">
              <span className="text-3xl">🔐</span>
            </div>
            <h1 className="text-3xl font-bold text-green-600 dark:text-green-400">
              EcoColeta
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              Recuperação de senha
            </p>
          </div>
        </FadeIn>

        <FadeIn type="fade-up" duration={500} delay={200}>
          <Card>
            {/* Step indicator */}
            <div className="flex items-center justify-center gap-2 mb-6">
              {['email', 'code', 'password'].map((s, i) => (
                <div key={s} className="flex items-center gap-2">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all duration-300 ${
                      step === s || (step === 'success' && i <= 2)
                        ? 'bg-green-500 text-white'
                        : i <= ['email', 'code', 'password'].indexOf(step)
                        ? 'bg-green-500 text-white'
                        : 'bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
                    }`}
                  >
                    {step === 'success' && i <= 2 ? '✓' : i + 1}
                  </div>
                  {i < 2 && (
                    <div
                      className={`w-8 h-0.5 transition-all duration-300 ${
                        ['email', 'code', 'password'].indexOf(step) > i
                          ? 'bg-green-500'
                          : 'bg-gray-200 dark:bg-gray-700'
                      }`}
                    />
                  )}
                </div>
              ))}
            </div>

            {step === 'success' ? (
              <div className="text-center py-6">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                  <span className="text-3xl">✅</span>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                  Senha redefinida!
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  Sua senha foi alterada com sucesso. Faça login com sua nova senha.
                </p>
                <Button onClick={() => navigate('/login')} fullWidth>
                  Ir para o Login
                </Button>
              </div>
            ) : step === 'email' ? (
              <>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
                  Esqueceu sua senha?
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
                  Digite seu email cadastrado e enviaremos um código de verificação.
                </p>

                <form onSubmit={handleSendCode} noValidate className="space-y-4">
                  {error && (
                    <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300 text-sm animate-slide-down">
                      {error}
                    </div>
                  )}

                  <Input
                    label="Email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="seu@email.com"
                    required
                  />

                  <Button type="submit" fullWidth isLoading={isLoading}>
                    Enviar Código
                  </Button>
                </form>
              </>
            ) : step === 'code' ? (
              <>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
                  Código de verificação
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
                  Enviamos um código de 6 dígitos para <strong>{email}</strong>. Digite-o abaixo.
                </p>

                <form onSubmit={handleVerifyCode} noValidate className="space-y-4">
                  {error && (
                    <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300 text-sm animate-slide-down">
                      {error}
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Código
                    </label>
                    <input
                      type="text"
                      value={code}
                      onChange={(e) => formatCode(e.target.value)}
                      placeholder="000000"
                      required
                      maxLength={6}
                      className="w-full text-center text-2xl tracking-[0.5em] font-mono px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-all"
                    />
                  </div>

                  <Button type="submit" fullWidth isLoading={isLoading}>
                    Verificar Código
                  </Button>

                  <button
                    type="button"
                    onClick={handleSendCode}
                    className="w-full text-sm text-green-600 dark:text-green-400 hover:underline text-center"
                  >
                    Reenviar código
                  </button>
                </form>
              </>
            ) : (
              <>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
                  Nova senha
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
                  Crie uma nova senha para sua conta.
                </p>

                <form onSubmit={handleResetPassword} noValidate className="space-y-4">
                  {(error || passwordError) && (
                    <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300 text-sm animate-slide-down">
                      {passwordError || error}
                    </div>
                  )}

                  <Input
                    label="Nova Senha"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Mínimo 6 caracteres"
                    required
                  />

                  <Input
                    label="Confirmar Nova Senha"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Repita a senha"
                    required
                  />

                  <Button type="submit" fullWidth isLoading={isLoading}>
                    Redefinir Senha
                  </Button>
                </form>
              </>
            )}

            {step !== 'success' && (
              <div className="mt-6 text-center">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Lembrou sua senha?{' '}
                  <Link to="/login" className="text-green-600 dark:text-green-400 hover:underline">
                    Voltar ao login
                  </Link>
                </p>
              </div>
            )}
          </Card>
        </FadeIn>
      </div>
    </div>
  );
}
