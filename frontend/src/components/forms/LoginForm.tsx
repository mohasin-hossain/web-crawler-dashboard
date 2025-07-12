import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useAuth, useAuthActions } from "../../stores/authStore";
import type { LoginRequest } from "../../types/auth";
import { Button } from "../ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "../ui/form";
import { Input } from "../ui/input";

const loginSchema = z.object({
  email: z
    .string()
    .min(1, "Email is required")
    .email("Please enter a valid email address"),
  password: z
    .string()
    .min(1, "Password is required")
    .min(8, "Password must be at least 8 characters"),
});

type LoginFormData = z.infer<typeof loginSchema>;

interface LoginFormProps {
  onSuccess?: () => void;
  onError?: (error: string) => void;
}

export function LoginForm({ onSuccess, onError }: LoginFormProps) {
  const { isSubmitting, error } = useAuth();
  const { login, clearError } = useAuthActions();

  const form = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  // Clear auth errors when component mounts
  useEffect(() => {
    clearError();
  }, [clearError]);

  // Clear auth errors when form values change
  useEffect(() => {
    if (error) {
      clearError();
    }
  }, [form.watch(), clearError, error]);

  const onSubmit = async (data: LoginFormData) => {
    try {
      console.log("Login attempt started");
      const loginData: LoginRequest = {
        email: data.email,
        password: data.password,
      };

      await login(loginData);
      console.log("Login successful");

      // If we get here, login was successful
      onSuccess?.();
    } catch (error: any) {
      console.error("Login error caught in form:", error);
      // Error is already handled in the auth store
      // The isSubmitting state should be reset there
      // Just call the onError callback if provided
      onError?.(error.message || "Login failed");
    }
  };

  return (
    <div className="w-full max-w-md mx-auto space-y-6">
      <div className="space-y-2 text-center">
        <h1 className="text-3xl font-bold">Sign In</h1>
        <p className="text-gray-500 dark:text-gray-400">
          Enter your email and password to access your account
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input
                    type="email"
                    placeholder="Enter your email"
                    {...field}
                    disabled={isSubmitting}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Password</FormLabel>
                <FormControl>
                  <Input
                    type="password"
                    placeholder="Enter your password"
                    {...field}
                    disabled={isSubmitting}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {(error || form.formState.errors.root) && (
            <div className="text-sm text-red-500 text-center bg-red-50 dark:bg-red-900/20 p-3 rounded-md border border-red-200 dark:border-red-800">
              {error || form.formState.errors.root?.message}
            </div>
          )}

          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? (
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Signing in...
              </div>
            ) : (
              "Sign In"
            )}
          </Button>
        </form>
      </Form>
    </div>
  );
}
