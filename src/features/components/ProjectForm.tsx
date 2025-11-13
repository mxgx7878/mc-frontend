// --- src/features/projects/components/ProjectForm.tsx ---
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { MapPin } from 'lucide-react';
import Autocomplete from 'react-google-autocomplete';
import { projectSchema } from '../projects/validators';
import type { ProjectFormValues } from '../projects/validators';
import Input from '../../components/common/Input';
import Button from '../../components/common/Buttons';

type Props = { 
  initial?: Partial<ProjectFormValues>; 
  onSubmit: (v: ProjectFormValues) => void; 
  submitting?: boolean 
};

export default function ProjectForm({ initial, onSubmit, submitting }: Props) {
  const { 
    register, 
    handleSubmit, 
    setValue,
    formState: { errors } 
  } = useForm<ProjectFormValues>({
    resolver: zodResolver(projectSchema),
    defaultValues: { ...initial },
  });

  const [locationCoords, setLocationCoords] = useState<{ lat: number; lng: number } | null>(
    initial?.delivery_lat && initial?.delivery_long 
      ? { lat: initial.delivery_lat, lng: initial.delivery_long } 
      : null
  );
console.log(locationCoords);
  const handlePlaceSelected = (place: any) => {
    if (place.formatted_address) {
      setValue('delivery_address', place.formatted_address, { shouldValidate: true });
    }
    if (place.geometry?.location) {
      const lat = place.geometry.location.lat();
      const lng = place.geometry.location.lng();
      setValue('delivery_lat', lat, { shouldValidate: true });
      setValue('delivery_long', lng, { shouldValidate: true });
      setLocationCoords({ lat, lng });
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 max-w-2xl">
      <Input 
        label="Project Name" 
        placeholder="e.g. Site A – Footings" 
        {...register('name')} 
        error={errors.name?.message} 
      />
      
      <Input 
        label="Site Contact Name" 
        placeholder="Optional" 
        {...register('site_contact_name')} 
        error={errors.site_contact_name?.message} 
      />
      
      <Input 
        label="Site Contact Phone" 
        placeholder="Optional" 
        {...register('site_contact_phone')} 
        error={errors.site_contact_phone?.message} 
      />
      
      <div>
        <label className="block text-sm font-medium mb-1">Site Instructions</label>
        <textarea 
          className="w-full border rounded px-3 py-2" 
          rows={4} 
          placeholder="Access notes, safety, gate code" 
          {...register('site_instructions')} 
        />
        {errors.site_instructions && (
          <p className="text-red-600 text-xs mt-1">{errors.site_instructions.message}</p>
        )}
      </div>

      {/* NEW: Delivery Address with Google Autocomplete */}
      <div>
        <label className="block text-sm font-medium mb-1 flex items-center gap-2">
          <MapPin size={16} className="text-primary-600" />
          Delivery Address
        </label>
        <Autocomplete
          apiKey={import.meta.env.VITE_GOOGLE_MAPS_API_KEY}
          onPlaceSelected={handlePlaceSelected}
          options={{
            types: ['address'],
            componentRestrictions: { country: 'au' }, // Adjust country as needed
          }}
          defaultValue={initial?.delivery_address || ''}
          className="w-full px-3 py-2 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          placeholder="Start typing address..."
        />
        {errors.delivery_address && (
          <p className="text-red-600 text-xs mt-1">{errors.delivery_address.message}</p>
        )}
        {locationCoords && (
          <p className="text-xs text-secondary-600 mt-1">
            📍 Location: {Number(locationCoords.lat).toFixed(6)}, {Number(locationCoords.lng).toFixed(6)}
          </p>
        )}
      </div>

      {/* Hidden fields for lat/long */}
      <input type="hidden" {...register('delivery_lat', { valueAsNumber: true })} />
      <input type="hidden" {...register('delivery_long', { valueAsNumber: true })} />

      <Button type="submit" disabled={submitting}>
        {submitting ? 'Saving...' : 'Save Project'}
      </Button>
    </form>
  );
}