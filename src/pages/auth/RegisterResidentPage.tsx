import { useState, FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { Card } from '@/components/Card';

export function RegisterResidentPage() {
  const [name, setName] = useState('');
  const [cpf, setCpf] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const { register, isLoading, error, clearError } = useAuth();
  const navigate = useNavigate();

  function validatePasswords(): boolean {
    if (password !== confirmPassword) {
      setPasswordError('Senhas não conferem');
      return false;
    }
    setPasswordError('');
    return true;
  }

  function formatCpf(value: string): string {
    const digits = value.replace(/\D/g, '').slice(0, 11);
    if (digits.length <= 3) return digits;
    if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`;
    if (digits.length <= 9) return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`;
    return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`;
  }

  function formatPhone(value: string): string {
    const digits = value.replace(/\D/g, '').slice(0, 11);
    if (digits.length <= 2) return `(${digits}`;
    if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
  }

  function handleCpfChange(value: string) {
    setCpf(formatCpf(value));
  }

  function handlePhoneChange(value: string) {
    setPhone(formatPhone(value));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    clearError();
    setPasswordError('');

    if (!validatePasswords()) return;

    try {
      const cpfDigits = cpf.replace(/\D/g, '');
      const phoneDigits = phone.replace(/\D/g, '');
      await register({ name, cpf: cpfDigits, phone: phoneDigits, email, password });
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
            Criar conta de morador
          </p>
        </div>

        <Card>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-6">
            Cadastro
          </h2>

          <form onSubmit={handleSubmit} noValidate className="space-y-4">
            {(error || passwordError) && (
              <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300 text-sm">
                {passwordError || error}
              </div>
            )}

            <Input
              label="Nome"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Seu nome completo"
              required
            />

            <Input
              label="CPF"
              type="text"
              value={cpf}
              onChange={(e) => handleCpfChange(e.target.value)}
              placeholder="000.000.000-00"
              required
            />

            <Input
              label="Telefone"
              type="tel"
              value={phone}
              onChange={(e) => handlePhoneChange(e.target.value)}
              placeholder="(11) 99999-8888"
              required
            />

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
              placeholder="Mínimo 6 caracteres"
              required
            />

            <Input
              label="Confirmar Senha"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Repita a senha"
              required
            />

            <Button type="submit" fullWidth isLoading={isLoading}>
              Criar Conta
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Já tem conta?{' '}
              <Link to="/login" className="text-green-600 dark:text-green-400 hover:underline">
                Entrar
              </Link>
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
}
