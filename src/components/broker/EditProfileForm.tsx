import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { 
  Save, 
  X, 
  Upload, 
  FileText, 
  User, 
  Building2, 
  Phone, 
  MapPin, 
  Globe,
  Calendar,
  Briefcase
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface BrokerProfile {
  id: string;
  full_name: string;
  company_name: string;
  phone: string;
  address: string;
  country: string;
  city: string;
  license_number: string;
  specializations: string[];
  years_experience: number;
  bio: string;
  verified_at: string;
  verification_notes: string;
  id_document_url: string;
  additional_documents: string[];
  profile_image_url: string;
  passport_document_url: string;
  created_at: string;
  updated_at: string;
}

interface EditProfileFormProps {
  profile: BrokerProfile;
  onSave: (updatedProfile: BrokerProfile) => void;
  onCancel: () => void;
}

const EditProfileForm: React.FC<EditProfileFormProps> = ({ profile, onSave, onCancel }) => {
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadingPassport, setUploadingPassport] = useState(false);
  const [formData, setFormData] = useState({
    full_name: profile.full_name || '',
    company_name: profile.company_name || '',
    phone: profile.phone || '',
    address: profile.address || '',
    country: profile.country || '',
    city: profile.city || '',
    license_number: profile.license_number || '',
    years_experience: profile.years_experience || 0,
    bio: profile.bio || '',
    specializations: profile.specializations || [],
    profile_image_url: profile.profile_image_url || '',
    passport_document_url: profile.passport_document_url || ''
  });
  const [newSpecialization, setNewSpecialization] = useState('');

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const addSpecialization = () => {
    if (newSpecialization.trim() && !formData.specializations.includes(newSpecialization.trim())) {
      setFormData(prev => ({
        ...prev,
        specializations: [...prev.specializations, newSpecialization.trim()]
      }));
      setNewSpecialization('');
    }
  };

  const removeSpecialization = (spec: string) => {
    setFormData(prev => ({
      ...prev,
      specializations: prev.specializations.filter(s => s !== spec)
    }));
  };

  const handleImageUpload = async (file: File, type: 'profile' | 'passport') => {
    const setUploading = type === 'profile' ? setUploadingImage : setUploadingPassport;
    setUploading(true);
    
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${profile.id}/${type}_${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('broker-documents')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      // Create signed URL for private bucket (valid for 1 year)
      const { data: signedUrlData, error: signedUrlError } = await supabase.storage
        .from('broker-documents')
        .createSignedUrl(fileName, 31536000); // 1 year in seconds

      if (signedUrlError) throw signedUrlError;

      const fieldName = type === 'profile' ? 'profile_image_url' : 'passport_document_url';
      handleInputChange(fieldName, signedUrlData.signedUrl);

      toast({
        title: "Success",
        description: `${type === 'profile' ? 'Profile image' : 'Passport document'} uploaded successfully`
      });
    } catch (error) {
      console.error(`Error uploading ${type}:`, error);
      toast({
        title: "Error",
        description: `Failed to upload ${type === 'profile' ? 'profile image' : 'passport document'}`,
        variant: "destructive"
      });
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const { data, error } = await supabase
        .from('broker_profiles')
        .update({
          full_name: formData.full_name,
          company_name: formData.company_name,
          phone: formData.phone,
          address: formData.address,
          country: formData.country,
          city: formData.city,
          license_number: formData.license_number,
          years_experience: formData.years_experience,
          bio: formData.bio,
          specializations: formData.specializations,
          profile_image_url: formData.profile_image_url,
          passport_document_url: formData.passport_document_url,
          updated_at: new Date().toISOString()
        })
        .eq('id', profile.id)
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Profile Updated",
        description: "Your broker profile has been successfully updated."
      });

      onSave(data);
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        title: "Error",
        description: "Failed to update profile. Please try again.",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Personal Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Personal Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="full_name">Full Name *</Label>
              <Input
                id="full_name"
                value={formData.full_name}
                onChange={(e) => handleInputChange('full_name', e.target.value)}
                placeholder="Enter your full name"
              />
            </div>
            <div>
              <Label htmlFor="phone">Phone Number *</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => handleInputChange('phone', e.target.value)}
                placeholder="Enter your phone number"
              />
            </div>
          </div>
          
          <div>
            <Label htmlFor="bio">Professional Bio</Label>
            <Textarea
              id="bio"
              value={formData.bio}
              onChange={(e) => handleInputChange('bio', e.target.value)}
              placeholder="Tell us about your experience and expertise..."
              rows={4}
            />
          </div>
        </CardContent>
      </Card>

      {/* Profile Image & Documents */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Profile Image & Documents
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Profile Image Upload */}
          <div>
            <Label>Profile Image</Label>
            <div className="flex items-center gap-4 mt-2">
              {formData.profile_image_url && (
                <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-gray-200">
                  <img 
                    src={formData.profile_image_url} 
                    alt="Profile" 
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              <div className="flex-1">
                <Input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleImageUpload(file, 'profile');
                  }}
                  disabled={uploadingImage}
                />
                {uploadingImage && (
                  <p className="text-sm text-muted-foreground mt-1">Uploading...</p>
                )}
              </div>
            </div>
          </div>

          {/* Passport Document Upload */}
          <div>
            <Label>Passport/ID Document</Label>
            <div className="flex items-center gap-4 mt-2">
              {formData.passport_document_url && (
                <div className="flex items-center gap-2 text-sm text-green-600">
                  <FileText className="h-4 w-4" />
                  Document uploaded
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.open(formData.passport_document_url, '_blank')}
                  >
                    View
                  </Button>
                </div>
              )}
              <div className="flex-1">
                <Input
                  type="file"
                  accept="image/*,.pdf"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleImageUpload(file, 'passport');
                  }}
                  disabled={uploadingPassport}
                />
                {uploadingPassport && (
                  <p className="text-sm text-muted-foreground mt-1">Uploading...</p>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Company Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Company Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="company_name">Company Name</Label>
            <Input
              id="company_name"
              value={formData.company_name}
              onChange={(e) => handleInputChange('company_name', e.target.value)}
              placeholder="Enter your company name"
            />
          </div>
          
          <div>
            <Label htmlFor="address">Business Address</Label>
            <Input
              id="address"
              value={formData.address}
              onChange={(e) => handleInputChange('address', e.target.value)}
              placeholder="Enter your business address"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="city">City</Label>
              <Input
                id="city"
                value={formData.city}
                onChange={(e) => handleInputChange('city', e.target.value)}
                placeholder="Enter city"
              />
            </div>
            <div>
              <Label htmlFor="country">Country</Label>
              <Input
                id="country"
                value={formData.country}
                onChange={(e) => handleInputChange('country', e.target.value)}
                placeholder="Enter country"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Professional Details */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Briefcase className="h-5 w-5" />
            Professional Details
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="license_number">License Number</Label>
              <Input
                id="license_number"
                value={formData.license_number}
                onChange={(e) => handleInputChange('license_number', e.target.value)}
                placeholder="Enter your license number"
              />
            </div>
            <div>
              <Label htmlFor="years_experience">Years of Experience</Label>
              <Input
                id="years_experience"
                type="number"
                value={formData.years_experience}
                onChange={(e) => handleInputChange('years_experience', parseInt(e.target.value) || 0)}
                placeholder="0"
                min="0"
              />
            </div>
          </div>

          <div>
            <Label>Specializations</Label>
            <div className="flex gap-2 mb-2">
              <Input
                value={newSpecialization}
                onChange={(e) => setNewSpecialization(e.target.value)}
                placeholder="Add a specialization"
                onKeyPress={(e) => e.key === 'Enter' && addSpecialization()}
              />
              <Button type="button" onClick={addSpecialization} variant="outline">
                Add
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {formData.specializations.map((spec, index) => (
                <Badge key={index} variant="secondary" className="flex items-center gap-1">
                  {spec}
                  <X 
                    className="h-3 w-3 cursor-pointer" 
                    onClick={() => removeSpecialization(spec)}
                  />
                </Badge>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex gap-3">
        <Button onClick={handleSave} disabled={saving} className="flex-1">
          <Save className="h-4 w-4 mr-2" />
          {saving ? 'Saving...' : 'Save Changes'}
        </Button>
        <Button onClick={onCancel} variant="outline" className="flex-1">
          <X className="h-4 w-4 mr-2" />
          Cancel
        </Button>
      </div>
    </div>
  );
};

export default EditProfileForm;