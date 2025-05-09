import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { useTranslations } from "@/hooks/use-translations";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

const loginSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

const registerSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string().min(6, "Please confirm your password"),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  preferredLanguage: z.enum(["en", "fr"]).default("en"),
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

type LoginFormValues = z.infer<typeof loginSchema>;
type RegisterFormValues = z.infer<typeof registerSchema>;

export default function AuthPage() {
  const [activeTab, setActiveTab] = useState<string>("login");
  const { user, loginMutation, registerMutation, isLoading } = useAuth();
  const [_, setLocation] = useLocation();
  const { t } = useTranslations();

  // Vérification de l'authentification et redirection
  useEffect(() => {
    if (user && !isLoading) {
      setLocation("/");
    }
  }, [user, isLoading, setLocation]);

  const loginForm = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  const registerForm = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      username: "",
      email: "",
      password: "",
      confirmPassword: "",
      firstName: "",
      lastName: "",
      preferredLanguage: "en",
    },
  });

  const onLoginSubmit = async (data: LoginFormValues) => {
    try {
      await loginMutation.mutateAsync(data);
    } catch (error) {
      // L'erreur est déjà gérée par le hook useAuth
    }
  };

  const onRegisterSubmit = (data: RegisterFormValues) => {
    // Remove confirmPassword before submitting
    const { confirmPassword, ...registerData } = data;
    registerMutation.mutate(registerData);
  };

  return (
    <div className="flex min-h-screen">
      {/* Left side - Auth forms */}
      <div className="flex-1 flex items-center justify-center p-8">
        <Tabs
          defaultValue="login"
          value={activeTab}
          onValueChange={setActiveTab}
          className="w-full max-w-md"
        >
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="login">{t.loginTitle}</TabsTrigger>
            <TabsTrigger value="register">{t.registerTitle}</TabsTrigger>
          </TabsList>

          {/* Login Form */}
          <TabsContent value="login">
            <Card>
              <CardHeader>
                <CardTitle>{t.loginTitle}</CardTitle>
                <CardDescription>
                  {t.loginText}
                </CardDescription>
              </CardHeader>
              <form onSubmit={loginForm.handleSubmit(onLoginSubmit)}>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="username">{t.username}</Label>
                    <Input 
                      id="username"
                      type="text"
                      {...loginForm.register("username")} 
                    />
                    {loginForm.formState.errors.username && (
                      <span className="text-sm text-red-500">
                        {loginForm.formState.errors.username.message}
                      </span>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password">{t.password}</Label>
                    <Input 
                      id="password"
                      type="password" 
                      {...loginForm.register("password")} 
                    />
                    {loginForm.formState.errors.password && (
                      <span className="text-sm text-red-500">
                        {loginForm.formState.errors.password.message}
                      </span>
                    )}
                  </div>
                </CardContent>
                <CardFooter>
                  <Button 
                    type="submit" 
                    className="w-full"
                    disabled={loginMutation.isPending}
                  >
                    {loginMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" /> 
                        {t.loggingOut}
                      </>
                    ) : (
                      t.loginButton
                    )}
                  </Button>
                </CardFooter>
              </form>
            </Card>
          </TabsContent>

          {/* Register Form */}
          <TabsContent value="register">
            <Card>
              <CardHeader>
                <CardTitle>{t.registerTitle}</CardTitle>
                <CardDescription>
                  {t.registerText}
                </CardDescription>
              </CardHeader>
              <form onSubmit={registerForm.handleSubmit(onRegisterSubmit)}>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="firstName">{t.firstName}</Label>
                      <Input 
                        id="firstName"
                        {...registerForm.register("firstName")} 
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lastName">{t.lastName}</Label>
                      <Input 
                        id="lastName"
                        {...registerForm.register("lastName")} 
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="reg-username">{t.username}</Label>
                    <Input 
                      id="reg-username"
                      {...registerForm.register("username")} 
                    />
                    {registerForm.formState.errors.username && (
                      <span className="text-sm text-red-500">
                        {registerForm.formState.errors.username.message}
                      </span>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">{t.email}</Label>
                    <Input 
                      id="email"
                      type="email" 
                      {...registerForm.register("email")} 
                    />
                    {registerForm.formState.errors.email && (
                      <span className="text-sm text-red-500">
                        {registerForm.formState.errors.email.message}
                      </span>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="reg-password">{t.password}</Label>
                    <Input 
                      id="reg-password"
                      type="password" 
                      {...registerForm.register("password")} 
                    />
                    {registerForm.formState.errors.password && (
                      <span className="text-sm text-red-500">
                        {registerForm.formState.errors.password.message}
                      </span>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">{t.password}</Label>
                    <Input 
                      id="confirmPassword"
                      type="password" 
                      {...registerForm.register("confirmPassword")} 
                    />
                    {registerForm.formState.errors.confirmPassword && (
                      <span className="text-sm text-red-500">
                        {registerForm.formState.errors.confirmPassword.message}
                      </span>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="language">Preferred Language</Label>
                    <select
                      id="language"
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      {...registerForm.register("preferredLanguage")}
                    >
                      <option value="en">English</option>
                      <option value="fr">Français</option>
                    </select>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button 
                    type="submit" 
                    className="w-full"
                    disabled={registerMutation.isPending}
                  >
                    {registerMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" /> 
                        {t.loggingOut}
                      </>
                    ) : (
                      t.registerButton
                    )}
                  </Button>
                </CardFooter>
              </form>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Right side - Hero section */}
      <div className="hidden lg:flex flex-1 bg-primary text-primary-foreground">
        <div className="flex flex-col justify-center px-12 py-24 space-y-6">
          <div>
            <h1 className="text-4xl font-bold mb-6">
              {t.authHeroTitle}
            </h1>
            <p className="text-xl opacity-90 mb-4">
              {t.authHeroSubtitle}
            </p>
            <p className="opacity-80 mb-4">
              {t.authDescription}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}