import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
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
  const { user, loginMutation, registerMutation } = useAuth();
  const [_, setLocation] = useLocation();

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      setLocation("/");
    }
  }, [user, setLocation]);

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

  const onLoginSubmit = (data: LoginFormValues) => {
    loginMutation.mutate(data);
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
            <TabsTrigger value="login">Login</TabsTrigger>
            <TabsTrigger value="register">Register</TabsTrigger>
          </TabsList>

          {/* Login Form */}
          <TabsContent value="login">
            <Card>
              <CardHeader>
                <CardTitle>Login to your account</CardTitle>
                <CardDescription>
                  Enter your username and password to access your account
                </CardDescription>
              </CardHeader>
              <form onSubmit={loginForm.handleSubmit(onLoginSubmit)}>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="username">Username</Label>
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
                    <Label htmlFor="password">Password</Label>
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
                        Logging in...
                      </>
                    ) : (
                      "Login"
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
                <CardTitle>Create an account</CardTitle>
                <CardDescription>
                  Enter your details to create a new account
                </CardDescription>
              </CardHeader>
              <form onSubmit={registerForm.handleSubmit(onRegisterSubmit)}>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="firstName">First name</Label>
                      <Input 
                        id="firstName"
                        {...registerForm.register("firstName")} 
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lastName">Last name</Label>
                      <Input 
                        id="lastName"
                        {...registerForm.register("lastName")} 
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="reg-username">Username</Label>
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
                    <Label htmlFor="email">Email</Label>
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
                    <Label htmlFor="reg-password">Password</Label>
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
                    <Label htmlFor="confirmPassword">Confirm Password</Label>
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
                        Creating account...
                      </>
                    ) : (
                      "Create account"
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
              Welcome to our E-Commerce Platform
            </h1>
            <p className="text-xl opacity-90 mb-4">
              Shop with confidence on our secure platform
            </p>
            <ul className="space-y-2 opacity-80">
              <li className="flex items-center space-x-2">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0">
                  <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
                <span>Wide selection of products</span>
              </li>
              <li className="flex items-center space-x-2">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0">
                  <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
                <span>Fast and reliable shipping</span>
              </li>
              <li className="flex items-center space-x-2">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0">
                  <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
                <span>Secure payment processing</span>
              </li>
              <li className="flex items-center space-x-2">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0">
                  <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
                <span>24/7 customer support</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}