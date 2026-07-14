import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiClient } from '@/services/api';
import { Input } from '@/components/Input';
import { Button } from '@/components/Button';
import { Material } from '@/types';

interface FormErrors {
  materialType?: string;
  quantityKg?: string;
}

export function NewRequestPage() {
  const navigate = useNavigate();
  const [materials, setMaterials] = useState<Material[]>([]);
  const [materialType, setMaterialType] = useState('');
  const [quantityKg, setQuantityKg] = useState('');
  const [desiredDate, setDesiredDate] = useState('');
  const [observations, setObservations] = useState('');
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    apiClient.get<Material[]>('/materials').then(setMaterials).catch(() => {});
  }, []);

  function validate(): FormErrors {
    const newErrors: FormErrors = {};
    if (!materialType) newErrors.materialType = 'Material é obrigatório';
    if (!quantityKg || parseFloat(quantityKg) <= 0) newErrors.quantityKg = 'Quantidade é obrigatória';
    return newErrors;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const validationErrors = validate();
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) return;

    setIsSubmitting(true);
    setSubmitError(null);
    try {
      const result = await apiClient.post<{ id: string }>('/requests', {
        materialType,
        quantityKg: parseFloat(quantityKg),
        desiredDate: desiredDate || undefined,
        observations: observations || undefined,
      });
      navigate(`/resident/requests/${result.id}`);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Falha ao criar solicitação');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Nova Solicitação de Coleta</h1>

      <form onSubmit={handleSubmit} noValidate className="space-y-6">
        <div>
          <label htmlFor="materialType" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Material <span className="text-red-500 ml-1">*</span>
          </label>
          <select
            id="materialType"
            value={materialType}
            onChange={(e) => setMaterialType(e.target.value)}
            className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent border-gray-300 dark:border-gray-600"
          >
            <option value="">Selecione o material</option>
            {materials.map((m) => (
              <option key={m.id} value={m.name.toLowerCase()}>
                {m.icon} {m.name}
              </option>
            ))}
          </select>
          {errors.materialType && <p className="mt-1 text-sm text-red-500">{errors.materialType}</p>}
        </div>

        <Input
          label="Quantidade (kg)"
          type="number"
          step="0.1"
          min="0"
          required
          value={quantityKg}
          onChange={(e) => setQuantityKg(e.target.value)}
          error={errors.quantityKg}
        />

        <Input
          label="Data Desejada"
          type="date"
          value={desiredDate}
          onChange={(e) => setDesiredDate(e.target.value)}
        />

        <div>
          <label htmlFor="observations" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Observações
          </label>
          <textarea
            id="observations"
            value={observations}
            onChange={(e) => setObservations(e.target.value)}
            rows={3}
            className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent border-gray-300 dark:border-gray-600"
            placeholder="Instruções especiais..."
          />
        </div>

        {submitError && <p className="text-red-500 text-sm">{submitError}</p>}

        <Button type="submit" fullWidth isLoading={isSubmitting}>
          Solicitar Coleta
        </Button>
      </form>
    </div>
  );
}
