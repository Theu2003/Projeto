import { useState, FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { Card } from '@/components/Card';
import { FadeIn } from '@/components/FadeIn';
import { GoogleLoginButton } from '@/components/GoogleLoginButton';

export function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login, googleLogin, isLoading, error, clearError } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    clearError();
    try {
      await login(email, password);
      navigate('/');
    } catch {
      // error is set in AuthContext
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-green-50 dark:from-gray-900 dark:to-gray-800 px-4">
      <div className="w-full max-w-md">
        <FadeIn type="fade-down" duration={600}>
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 mb-4 animate-bounce-gentle">
              <span className="text-3xl">♻️</span>
            </div>
            <h1 className="text-3xl font-bold text-green-600 dark:text-green-400">
              EcoColeta
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              Conectando moradores à coleta seletiva
            </p>
          </div>
        </FadeIn>

        <FadeIn type="fade-up" duration={500} delay={200}>
          <Card>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-6">
              Entrar
            </h2>

            <form onSubmit={handleSubmit} noValidate className="space-y-4">
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

              <Input
                label="Senha"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Sua senha"
                required
              />

              <Button type="submit" fullWidth isLoading={isLoading}>
                Entrar
              </Button>
            </form>

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300 dark:border-gray-600" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400">
                  ou continue com
                </span>
              </div>
            </div>

            <GoogleLoginButton
              onSuccess={async (credential) => {
                try {
                  await googleLogin(credential);
                  navigate('/');
                } catch {
                  // error is set in AuthContext
                }
              }}
              onError={(err) => console.error('Google login error:', err)}
              isLoading={isLoading}
            />

            <div className="mt-6 space-y-2">
              <p className="text-center text-sm text-gray-600 dark:text-gray-400">
                Não tem conta?{' '}
                <Link to="/register/resident" className="text-green-600 dark:text-green-400 hover:underline">
                  Criar conta de morador
                </Link>
              </p>
              <p className="text-center text-sm text-gray-600 dark:text-gray-400">
                Empresa de coleta?{' '}
                <Link to="/register/company" className="text-green-600 dark:text-green-400 hover:underline">
                  Cadastrar empresa
                </Link>
              </p>
            </div>
          </Card>
        </FadeIn>
      </div>
    </div>
  );
}
