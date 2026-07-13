import { useState, FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { Card } from '@/components/Card';

export function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login, isLoading, error, clearError } = useAuth();
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
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-green-600 dark:text-green-400">
            EcoColeta
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Conectando moradores à coleta seletiva
          </p>
        </div>

        <Card>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-6">
            Entrar
          </h2>

          <form onSubmit={handleSubmit} noValidate className="space-y-4">
            {error && (
              <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300 text-sm">
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
      </div>
    </div>
  );
}
