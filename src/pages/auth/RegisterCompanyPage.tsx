import { useState, FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { Card } from '@/components/Card';

export function RegisterCompanyPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [cnpj, setCnpj] = useState('');
  const [responsible, setResponsible] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const { registerCompany, isLoading, error, clearError } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    clearError();

    try {
      await registerCompany({ name, email, password, cnpj, responsible, phone, address });
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
            Cadastro de empresa de coleta
          </p>
        </div>

        <Card>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-6">
            Cadastrar Empresa
          </h2>

          <form onSubmit={handleSubmit} noValidate className="space-y-4">
            {error && (
              <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300 text-sm">
                {error}
              </div>
            )}

            <Input
              label="Nome da Empresa"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nome da empresa"
              required
            />

            <Input
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="empresa@email.com"
              required
            />

            <Input
              label="CNPJ"
              type="text"
              value={cnpj}
              onChange={(e) => setCnpj(e.target.value)}
              placeholder="00.000.000/0000-00"
              required
            />

            <Input
              label="Responsável"
              type="text"
              value={responsible}
              onChange={(e) => setResponsible(e.target.value)}
              placeholder="Nome do responsável"
              required
            />

            <Input
              label="Telefone"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="(11) 99999-8888"
              required
            />

            <Input
              label="Endereço"
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Rua, número - Bairro"
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

            <Button type="submit" fullWidth isLoading={isLoading}>
              Cadastrar Empresa
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
