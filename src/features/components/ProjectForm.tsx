// --- src/features/projects/components/ProjectForm.tsx ---
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { projectSchema, ProjectFormValues } from '../projects/validators';
import Input from '../../components/common/Input';
import Button from '../../components/common/Buttons';

type Props = { initial?: Partial<ProjectFormValues>; onSubmit: (v: ProjectFormValues) => void; submitting?: boolean };
export default function ProjectForm({ initial, onSubmit, submitting }: Props) {
  const { register, handleSubmit, formState: { errors } } = useForm<ProjectFormValues>({
    resolver: zodResolver(projectSchema),
    defaultValues: { ...initial },
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 max-w-2xl">
      <Input label="Project Name" placeholder="e.g. Site A – Footings" {...register('name')} error={errors.name?.message} />
      <Input label="Site Contact Name" placeholder="Optional" {...register('site_contact_name')} error={errors.site_contact_name?.message} />
      <Input label="Site Contact Phone" placeholder="Optional" {...register('site_contact_phone')} error={errors.site_contact_phone?.message} />
      <div>
        <label className="block text-sm font-medium mb-1">Site Instructions</label>
        <textarea className="w-full border rounded px-3 py-2" rows={4} placeholder="Access notes, safety, gate code" {...register('site_instructions')} />
        {errors.site_instructions && <p className="text-red-600 text-xs mt-1">{errors.site_instructions.message}</p>}
      </div>
      <Button type="submit" disabled={submitting}>{submitting ? 'Saving' : 'Save Project'}</Button>
    </form>
  );
}
