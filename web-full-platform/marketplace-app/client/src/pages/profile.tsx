import { useState, useRef, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { Save, Camera, User, Mail, Phone, MapPin, Edit, Loader2, ImageIcon, Store, Shield, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/auth-context";
import { useSettings } from "@/lib/settings-context";
import { useQuery } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { z } from "zod";
import { getFirebaseStorage } from "@/lib/firebase";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";

const profileUpdateSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  userName: z.string().min(3, "Username must be at least 3 characters").regex(/^[a-zA-Z0-9_]+$/, "Username can only contain letters, numbers, and underscores"),
  email: z.string().email("Please enter a valid email address"),
  phone: z.string().optional().refine((phone) => {
    if (!phone || phone === '') return true;
    const phoneRegex = /^[\+]?[1-9][\d]{0,15}$|^[\+]?[(]?[0-9]{3}[)]?[-.\s]?[0-9]{3}[-.\s]?[0-9]{4,6}$|^[\+]?[0-9]{8,15}$/;
    return phoneRegex.test(phone.replace(/[\s\-\(\)]/g, ''));
  }, "Please enter a valid phone number"),
  country: z.string().min(1, "Country is required"),
});

type ProfileUpdateData = z.infer<typeof profileUpdateSchema>;

export default function Profile() {
  const [isEditing, setIsEditing] = useState(false);
  const [updateError, setUpdateError] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [isUploadingCover, setIsUploadingCover] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [coverUploadProgress, setCoverUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const { user, refreshUserData } = useAuth();
  const { isFirebaseReady, fetchSettings } = useSettings();
  
  // Fetch settings to ensure Firebase is initialized for image uploads
  useEffect(() => {
    if (!isFirebaseReady) {
      fetchSettings();
    }
  }, [isFirebaseReady, fetchSettings]);
  
  const userId = (user as any)?._id || user?.id;
  
  const { data: freshUserData } = useQuery<any>({
    queryKey: [`/api/profile/${userId}`],
    enabled: !!userId,
    staleTime: 0,
  });
  
  const currentUser = freshUserData || user;

  const form = useForm<ProfileUpdateData>({
    resolver: zodResolver(profileUpdateSchema),
    defaultValues: {
      firstName: currentUser?.firstName || "",
      lastName: currentUser?.lastName || "",
      userName: currentUser?.userName || "",
      email: currentUser?.email || "",
      phone: currentUser?.phonenumber || currentUser?.phone || "",
      country: currentUser?.country || "",
    },
  });

  // Reset form when fresh user data is loaded
  useEffect(() => {
    if (freshUserData && !isEditing) {
      form.reset({
        firstName: freshUserData.firstName || "",
        lastName: freshUserData.lastName || "",
        userName: freshUserData.userName || "",
        email: freshUserData.email || "",
        phone: freshUserData.phonenumber || freshUserData.phone || "",
        country: freshUserData.country || "",
      });
    }
  }, [freshUserData, isEditing, form]);

  const isSocialLogin = currentUser?.authProvider === 'google' || currentUser?.authProvider === 'apple';

  const onSubmit = async (data: ProfileUpdateData) => {
    try {
      setIsLoading(true);
      setUpdateError("");
      
      // Transform phone to phonenumber for the API
      const { phone, ...rest } = data;
      const payload = {
        ...rest,
        phonenumber: phone,
      };
      
      const response = await fetch('/api/users/profile', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to update profile');
      }

      if (result.data) {
        const accessToken = localStorage.getItem('accessToken');
        localStorage.setItem('user', JSON.stringify(result.data));
        if (accessToken) {
          localStorage.setItem('accessToken', accessToken);
        }
        
        form.reset({
          firstName: result.data.firstName || "",
          lastName: result.data.lastName || "",
          userName: result.data.userName || "",
          email: result.data.email || "",
          phone: result.data.phonenumber || result.data.phone || "",
          country: result.data.country || "",
        });
      }
      
      queryClient.invalidateQueries({ queryKey: [`/api/profile/${userId}`] });
      
      if (refreshUserData) {
        await refreshUserData();
      }
      
      toast({ 
        title: "Profile updated", 
        description: "Your profile has been successfully updated." 
      });
      
      setIsEditing(false);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Profile update failed';
      setUpdateError(errorMessage);
      toast({ 
        title: "Update failed", 
        description: errorMessage,
        variant: "destructive" 
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    form.reset();
    setIsEditing(false);
    setUpdateError("");
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>, type: 'profile' | 'cover') => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!isFirebaseReady) {
      toast({
        title: "Upload not ready",
        description: "Please wait for the app to fully load before uploading images.",
        variant: "destructive"
      });
      return;
    }

    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      toast({
        title: "Invalid file type",
        description: "Please select a valid image file (JPEG, PNG, GIF, or WebP)",
        variant: "destructive"
      });
      return;
    }

    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      toast({
        title: "File too large",
        description: "Please select an image smaller than 5MB",
        variant: "destructive"
      });
      return;
    }

    try {
      if (type === 'profile') {
        setIsUploadingImage(true);
        setUploadProgress(0);
      } else {
        setIsUploadingCover(true);
        setCoverUploadProgress(0);
      }

      const storage = getFirebaseStorage();
      
      const timestamp = Date.now();
      const folder = type === 'profile' ? 'profile-images' : 'cover-images';
      const fileName = `${folder}/${user?.id || 'unknown'}_${timestamp}_${file.name}`;
      const storageRef = ref(storage, fileName);

      const uploadTask = uploadBytesResumable(storageRef, file);

      uploadTask.on(
        'state_changed',
        (snapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          if (type === 'profile') {
            setUploadProgress(Math.round(progress));
          } else {
            setCoverUploadProgress(Math.round(progress));
          }
        },
        (error) => {
          console.error('Upload error:', error);
          toast({
            title: "Upload failed",
            description: error.message || "Failed to upload image",
            variant: "destructive"
          });
          if (type === 'profile') {
            setIsUploadingImage(false);
            setUploadProgress(0);
          } else {
            setIsUploadingCover(false);
            setCoverUploadProgress(0);
          }
        },
        async () => {
          try {
            const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);

            const updateField = type === 'profile' ? 'profilePhoto' : 'coverPhoto';
            const response = await fetch('/api/users/profile', {
              method: 'PATCH',
              headers: {
                'Content-Type': 'application/json',
              },
              credentials: 'include',
              body: JSON.stringify({ [updateField]: downloadURL }),
            });

            const result = await response.json();

            if (!response.ok) {
              throw new Error(result.error || `Failed to update ${type} photo`);
            }

            if (result.data) {
              const currentUserData = localStorage.getItem('user');
              if (currentUserData) {
                const updatedUser = {
                  ...JSON.parse(currentUserData),
                  ...result.data,
                };
                localStorage.setItem('user', JSON.stringify(updatedUser));
              }
            }

            const userId = (user as any)?._id || user?.id;
            queryClient.invalidateQueries({ queryKey: ['/api/profile', userId] });
            queryClient.invalidateQueries({ queryKey: [`/api/profile/${userId}`] });
            
            if (refreshUserData) {
              await refreshUserData();
            }

            toast({
              title: `${type === 'profile' ? 'Profile' : 'Cover'} photo updated`,
              description: `Your ${type} photo has been successfully updated.`
            });
          } catch (error) {
            console.error('Profile update error:', error);
            toast({
              title: "Update failed",
              description: error instanceof Error ? error.message : `Failed to update ${type} photo`,
              variant: "destructive"
            });
          } finally {
            if (type === 'profile') {
              setIsUploadingImage(false);
              setUploadProgress(0);
            } else {
              setIsUploadingCover(false);
              setCoverUploadProgress(0);
            }
          }
        }
      );
    } catch (error) {
      console.error('Image upload error:', error);
      toast({
        title: "Upload failed",
        description: error instanceof Error ? error.message : "Failed to upload image",
        variant: "destructive"
      });
      if (type === 'profile') {
        setIsUploadingImage(false);
        setUploadProgress(0);
      } else {
        setIsUploadingCover(false);
        setCoverUploadProgress(0);
      }
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="w-full p-4 sm:p-6 space-y-4 sm:space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Profile</h1>
            <p className="text-sm text-muted-foreground">Manage your account information and preferences</p>
          </div>
          {!isEditing && (
            <Button 
              onClick={() => setIsEditing(true)}
              data-testid="button-edit-profile"
            >
              <Edit className="h-4 w-4 mr-2" />
              Edit Profile
            </Button>
          )}
        </div>

        <Card className="overflow-hidden">
          <div className="relative h-32 sm:h-48 bg-gradient-to-r from-primary/20 to-primary/5">
            {currentUser?.coverPhoto ? (
              <img 
                src={currentUser.coverPhoto} 
                alt="Cover" 
                className="w-full h-full object-cover"
                data-testid="img-cover-photo"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <ImageIcon className="h-12 w-12 text-muted-foreground/30" />
              </div>
            )}
            {isEditing && (
              <>
                <input
                  ref={coverInputRef}
                  type="file"
                  accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                  onChange={(e) => handleImageUpload(e, 'cover')}
                  className="hidden"
                  data-testid="input-cover-upload"
                />
                <Button 
                  variant="secondary"
                  size="sm"
                  className="absolute bottom-3 right-3"
                  onClick={() => coverInputRef.current?.click()}
                  disabled={isUploadingCover}
                  data-testid="button-upload-cover"
                >
                  {isUploadingCover ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      {coverUploadProgress}%
                    </>
                  ) : (
                    <>
                      <ImageIcon className="h-4 w-4 mr-2" />
                      Change Cover
                    </>
                  )}
                </Button>
              </>
            )}
            <div className="absolute -bottom-12 left-4 sm:left-6">
              <div className="relative">
                <Avatar className="h-24 w-24 border-4 border-background" data-testid="avatar-profile">
                  <AvatarImage src={currentUser?.profilePhoto} />
                  <AvatarFallback className="text-lg bg-muted">
                    {currentUser?.firstName?.[0]}{currentUser?.lastName?.[0]}
                  </AvatarFallback>
                </Avatar>
                {isEditing && (
                  <>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                      onChange={(e) => handleImageUpload(e, 'profile')}
                      className="hidden"
                      data-testid="input-file-upload"
                    />
                    <Button 
                      variant="secondary"
                      size="icon"
                      className="absolute bottom-0 right-0 h-8 w-8 rounded-full"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isUploadingImage}
                      data-testid="button-upload-photo"
                    >
                      {isUploadingImage ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Camera className="h-4 w-4" />
                      )}
                    </Button>
                  </>
                )}
              </div>
            </div>
          </div>
          
          <CardContent className="pt-16 pb-6">
            <div className="flex flex-wrap items-center gap-2 mb-4">
              <h2 className="text-xl font-semibold" data-testid="text-display-name">
                {currentUser?.firstName} {currentUser?.lastName}
              </h2>
              {currentUser?.seller && (
                <Badge variant="secondary" className="gap-1">
                  <Store className="h-3 w-3" />
                  Seller
                </Badge>
              )}
              {currentUser?.admin && (
                <Badge variant="default" className="gap-1">
                  <Shield className="h-3 w-3" />
                  Admin
                </Badge>
              )}
              {currentUser?.above_age && (
                <Badge variant="outline" className="gap-1">
                  <CheckCircle className="h-3 w-3" />
                  Verified
                </Badge>
              )}
            </div>
            <p className="text-muted-foreground" data-testid="text-username-display">
              @{currentUser?.userName || "username"}
            </p>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle className="flex items-center text-base sm:text-lg">
                <User className="h-5 w-5 mr-2" />
                Quick Info
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center h-10 w-10 rounded-full bg-primary/10">
                  <Mail className="h-5 w-5 text-primary" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs text-muted-foreground">Email</p>
                  <p className="text-sm font-medium truncate" data-testid="text-email-quick">
                    {currentUser?.email || "Not provided"}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center h-10 w-10 rounded-full bg-primary/10">
                  <Phone className="h-5 w-5 text-primary" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs text-muted-foreground">Phone</p>
                  <p className="text-sm font-medium" data-testid="text-phone-quick">
                    {currentUser?.phonenumber || currentUser?.phone || "Not provided"}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center h-10 w-10 rounded-full bg-primary/10">
                  <MapPin className="h-5 w-5 text-primary" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs text-muted-foreground">Country</p>
                  <p className="text-sm font-medium" data-testid="text-country-quick">
                    {currentUser?.country || "Not provided"}
                  </p>
                </div>
              </div>

              {isSocialLogin && (
                <div className="pt-2">
                  <Badge variant="outline" className="w-full justify-center gap-1">
                    {currentUser?.authProvider === 'google' ? 'Google' : 'Apple'} Account
                  </Badge>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center text-base sm:text-lg">
                <Edit className="h-5 w-5 mr-2" />
                {isEditing ? "Edit Information" : "Profile Details"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {updateError && (
                <Alert variant="destructive" className="mb-6" data-testid="alert-update-error">
                  <AlertDescription>{updateError}</AlertDescription>
                </Alert>
              )}

              {isEditing ? (
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="firstName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>First Name</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="Enter your first name"
                                data-testid="input-first-name"
                                {...field} 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="lastName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Last Name</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="Enter your last name"
                                data-testid="input-last-name"
                                {...field} 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="userName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Username</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="Enter your username"
                              data-testid="input-username"
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email Address</FormLabel>
                          <FormControl>
                            <Input 
                              type="email"
                              placeholder="Enter your email"
                              data-testid="input-email"
                              disabled={isSocialLogin}
                              {...field} 
                            />
                          </FormControl>
                          {isSocialLogin && (
                            <p className="text-xs text-muted-foreground">
                              Email cannot be changed for {currentUser?.authProvider === 'google' ? 'Google' : 'Apple'} accounts
                            </p>
                          )}
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="phone"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Phone Number</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="Enter your phone number"
                                data-testid="input-phone"
                                {...field} 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="country"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Country</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="Enter your country"
                                data-testid="input-country"
                                {...field} 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <Separator className="my-6" />

                    <div className="flex justify-end gap-4">
                      <Button 
                        type="button"
                        variant="outline"
                        onClick={handleCancel}
                        disabled={isLoading}
                        data-testid="button-cancel"
                      >
                        Cancel
                      </Button>
                      <Button 
                        type="submit"
                        disabled={isLoading}
                        data-testid="button-save"
                      >
                        {isLoading ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                            Saving...
                          </>
                        ) : (
                          <>
                            <Save className="h-4 w-4 mr-2" />
                            Save Changes
                          </>
                        )}
                      </Button>
                    </div>
                  </form>
                </Form>
              ) : (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-muted-foreground">First Name</Label>
                      <p className="text-foreground" data-testid="text-first-name">
                        {currentUser?.firstName || "Not provided"}
                      </p>
                    </div>
                    
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-muted-foreground">Last Name</Label>
                      <p className="text-foreground" data-testid="text-last-name">
                        {currentUser?.lastName || "Not provided"}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-muted-foreground">Username</Label>
                    <p className="text-foreground" data-testid="text-username">
                      @{currentUser?.userName || "Not provided"}
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                      <Mail className="h-4 w-4" />
                      Email Address
                      {isSocialLogin && (
                        <Badge variant="secondary" className="text-xs">
                          {currentUser?.authProvider === 'google' ? 'Google' : 'Apple'}
                        </Badge>
                      )}
                    </Label>
                    <p className="text-foreground" data-testid="text-email">
                      {currentUser?.email || "Not provided"}
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                        <Phone className="h-4 w-4" />
                        Phone Number
                      </Label>
                      <p className="text-foreground" data-testid="text-phone">
                        {currentUser?.phonenumber || currentUser?.phone || "Not provided"}
                      </p>
                    </div>
                    
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                        <MapPin className="h-4 w-4" />
                        Country
                      </Label>
                      <p className="text-foreground" data-testid="text-country">
                        {currentUser?.country || "Not provided"}
                      </p>
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-muted-foreground">Account Status</Label>
                    <div className="flex flex-wrap gap-2">
                      {currentUser?.seller ? (
                        <Badge variant="secondary" className="gap-1">
                          <Store className="h-3 w-3" />
                          Seller Account
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="gap-1">
                          <User className="h-3 w-3" />
                          Buyer Account
                        </Badge>
                      )}
                      {currentUser?.admin && (
                        <Badge variant="default" className="gap-1">
                          <Shield className="h-3 w-3" />
                          Administrator
                        </Badge>
                      )}
                      {currentUser?.above_age && (
                        <Badge variant="outline" className="gap-1 text-green-600 border-green-600">
                          <CheckCircle className="h-3 w-3" />
                          Age Verified
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
