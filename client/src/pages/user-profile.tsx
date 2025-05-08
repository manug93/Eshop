import React from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useTranslations } from '@/hooks/use-translations';
import { useToast } from '@/hooks/use-toast';
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { Loader2 } from 'lucide-react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Redirect } from 'wouter';

// Schema pour les formulaires
const profileSchema = z.object({
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  email: z.string().email(),
  preferredLanguage: z.string().optional(),
});

const addressSchema = z.object({
  addressLine1: z.string().min(1, "L'adresse est requise"),
  addressLine2: z.string().optional(),
  city: z.string().min(1, "La ville est requise"),
  state: z.string().min(1, "La province/région est requise"),
  postalCode: z.string().min(1, "Le code postal est requis"),
  country: z.string().min(1, "Le pays est requis"),
  phone: z.string().optional(),
});

type ProfileFormValues = z.infer<typeof profileSchema>;
type AddressFormValues = z.infer<typeof addressSchema>;

export default function UserProfile() {
  const { user, isLoading: authLoading } = useAuth();
  const { t } = useTranslations();
  const { toast } = useToast();

  // Récupérer les adresses de l'utilisateur
  const { data: addresses, isLoading: addressesLoading } = useQuery({
    queryKey: ['/api/user/addresses'],
    queryFn: async () => {
      try {
        const res = await apiRequest('GET', '/api/user/addresses');
        if (!res.ok) return [];
        return res.data;
      } catch (error) {
        return [];
      }
    },
    enabled: !!user,
  });
  
  // Récupérer l'adresse par défaut de l'utilisateur
  const { data: defaultAddress, isLoading: defaultAddressLoading } = useQuery({
    queryKey: ['/api/user/addresses/default'],
    queryFn: async () => {
      try {
        const res = await apiRequest('GET', '/api/user/addresses/default');
        if (!res.ok) return null;
        return res.data;
      } catch (error) {
        return null;
      }
    },
    enabled: !!user,
  });

  // Formulaire de profil
  const profileForm = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      firstName: user?.firstName || '',
      lastName: user?.lastName || '',
      email: user?.email || '',
      preferredLanguage: user?.preferredLanguage || 'en',
    },
  });

  // Formulaire d'adresse
  const addressForm = useForm<AddressFormValues>({
    resolver: zodResolver(addressSchema),
    defaultValues: {
      addressLine1: defaultAddress?.addressLine1 || '',
      addressLine2: defaultAddress?.addressLine2 || '',
      city: defaultAddress?.city || '',
      state: defaultAddress?.state || '',
      postalCode: defaultAddress?.postalCode || '',
      country: defaultAddress?.country || '',
      phone: defaultAddress?.phone || '',
    },
  });

  // Mettre à jour le formulaire d'adresse quand les données sont chargées
  React.useEffect(() => {
    if (defaultAddress) {
      addressForm.reset({
        addressLine1: defaultAddress.addressLine1 || '',
        addressLine2: defaultAddress.addressLine2 || '',
        city: defaultAddress.city || '',
        state: defaultAddress.state || '',
        postalCode: defaultAddress.postalCode || '',
        country: defaultAddress.country || '',
        phone: defaultAddress.phone || '',
      });
    }
  }, [defaultAddress, addressForm]);

  // Mutation pour mettre à jour le profil
  const updateProfileMutation = useMutation({
    mutationFn: async (data: ProfileFormValues) => {
      const res = await apiRequest('PUT', '/api/user/profile', {
        body: data
      });
      if (!res.ok) {
        throw new Error(t.errorUpdatingProfile || "Erreur lors de la mise à jour du profil");
      }
      return res.data;
    },
    onSuccess: (updatedUser) => {
      queryClient.setQueryData(['/api/user'], updatedUser);
      toast({
        title: t.profileUpdated || "Profil mis à jour",
        description: t.profileUpdatedSuccess || "Vos informations ont été mises à jour avec succès",
      });
    },
    onError: (error: Error) => {
      toast({
        title: t.error || "Erreur",
        description: error.message || t.errorUpdatingProfile || "Erreur lors de la mise à jour du profil",
        variant: "destructive",
      });
    },
  });

  // Mutation pour créer une nouvelle adresse
  const createAddressMutation = useMutation({
    mutationFn: async (data: AddressFormValues & { isDefault?: boolean }) => {
      const res = await apiRequest('POST', '/api/user/addresses', {
        body: data
      });
      if (!res.ok) {
        throw new Error("Erreur lors de la création de l'adresse");
      }
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/user/addresses'] });
      queryClient.invalidateQueries({ queryKey: ['/api/user/addresses/default'] });
      toast({
        title: "Adresse créée",
        description: "Votre adresse a été créée avec succès",
      });
    },
    onError: (error: Error) => {
      toast({
        title: t.error || "Erreur",
        description: error.message || "Erreur lors de la création de l'adresse",
        variant: "destructive",
      });
    },
  });
  
  // Mutation pour mettre à jour une adresse existante
  const updateAddressMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number, data: AddressFormValues }) => {
      const res = await apiRequest('PUT', `/api/user/addresses/${id}`, {
        body: data
      });
      if (!res.ok) {
        throw new Error(t.errorUpdatingAddress || "Erreur lors de la mise à jour de l'adresse");
      }
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/user/addresses'] });
      queryClient.invalidateQueries({ queryKey: ['/api/user/addresses/default'] });
      toast({
        title: t.addressUpdated || "Adresse mise à jour",
        description: t.addressUpdatedSuccess || "Votre adresse a été mise à jour avec succès",
      });
    },
    onError: (error: Error) => {
      toast({
        title: t.error || "Erreur",
        description: error.message || t.errorUpdatingAddress || "Erreur lors de la mise à jour de l'adresse",
        variant: "destructive",
      });
    },
  });

  // Soumission du formulaire de profil
  const onProfileSubmit = (data: ProfileFormValues) => {
    updateProfileMutation.mutate(data);
  };

  // Soumission du formulaire d'adresse
  const onAddressSubmit = (data: AddressFormValues) => {
    if (defaultAddress) {
      // Mettre à jour l'adresse existante
      updateAddressMutation.mutate({ id: defaultAddress.id, data });
    } else {
      // Créer une nouvelle adresse
      createAddressMutation.mutate({ ...data, isDefault: true });
    }
  };

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return <Redirect to="/auth" />;
  }

  return (
    <div className="container mx-auto py-10 px-4 max-w-4xl">
      <h1 className="text-3xl font-bold mb-6">{t.profile || "Profil"}</h1>
      
      <Tabs defaultValue="profile" className="w-full">
        <TabsList>
          <TabsTrigger value="profile">{t.personalInfo || "Informations personnelles"}</TabsTrigger>
          <TabsTrigger value="address">{t.shippingAddress || "Adresse de livraison"}</TabsTrigger>
        </TabsList>
        
        <TabsContent value="profile">
          <Card>
            <CardHeader>
              <CardTitle>{t.personalInfo || "Informations personnelles"}</CardTitle>
              <CardDescription>
                {t.personalInfoDesc || "Mettez à jour vos informations personnelles"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...profileForm}>
                <form id="profile-form" onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={profileForm.control}
                      name="firstName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t.firstName}</FormLabel>
                          <FormControl>
                            <Input placeholder={t.firstName} {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={profileForm.control}
                      name="lastName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t.lastName}</FormLabel>
                          <FormControl>
                            <Input placeholder={t.lastName} {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <FormField
                    control={profileForm.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t.email}</FormLabel>
                        <FormControl>
                          <Input placeholder={t.email} {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={profileForm.control}
                    name="preferredLanguage"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t.preferredLanguage || "Langue préférée"}</FormLabel>
                        <FormControl>
                          <select 
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            {...field}
                          >
                            <option value="en">English</option>
                            <option value="fr">Français</option>
                          </select>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                </form>
              </Form>
            </CardContent>
            <CardFooter>
              <Button 
                type="submit" 
                form="profile-form"
                disabled={updateProfileMutation.isPending}
              >
                {updateProfileMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {t.updating || "Mise à jour..."}
                  </>
                ) : (
                  t.saveChanges || "Enregistrer les modifications"
                )}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
        
        <TabsContent value="address">
          <Card>
            <CardHeader>
              <CardTitle>{t.shippingAddress || "Adresse de livraison"}</CardTitle>
              <CardDescription>
                {t.shippingAddressDesc || "Mettez à jour votre adresse de livraison pour vos commandes"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...addressForm}>
                <form id="address-form" onSubmit={addressForm.handleSubmit(onAddressSubmit)} className="space-y-4">
                  <FormField
                    control={addressForm.control}
                    name="addressLine1"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t.addressLine1 || "Adresse"}</FormLabel>
                        <FormControl>
                          <Input placeholder={t.addressLine1 || "Adresse"} {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={addressForm.control}
                    name="addressLine2"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t.addressLine2 || "Complément d'adresse"}</FormLabel>
                        <FormControl>
                          <Input placeholder={t.addressLine2 || "Complément d'adresse"} {...field} />
                        </FormControl>
                        <FormDescription>
                          {t.optional || "Optionnel"}
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={addressForm.control}
                      name="city"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t.city || "Ville"}</FormLabel>
                          <FormControl>
                            <Input placeholder={t.city || "Ville"} {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={addressForm.control}
                      name="state"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t.state || "Province/État/Région"}</FormLabel>
                          <FormControl>
                            <Input placeholder={t.state || "Province/État/Région"} {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={addressForm.control}
                      name="postalCode"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t.postalCode || "Code postal"}</FormLabel>
                          <FormControl>
                            <Input placeholder={t.postalCode || "Code postal"} {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={addressForm.control}
                      name="country"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t.country || "Pays"}</FormLabel>
                          <FormControl>
                            <Input placeholder={t.country || "Pays"} {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <FormField
                    control={addressForm.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t.phone || "Téléphone"}</FormLabel>
                        <FormControl>
                          <Input placeholder={t.phone || "Téléphone"} {...field} />
                        </FormControl>
                        <FormDescription>
                          {t.optional || "Optionnel"}
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </form>
              </Form>
            </CardContent>
            <CardFooter>
              <Button 
                type="submit" 
                form="address-form"
                disabled={updateAddressMutation.isPending}
              >
                {updateAddressMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {t.updating || "Mise à jour..."}
                  </>
                ) : (
                  t.saveChanges || "Enregistrer les modifications"
                )}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}