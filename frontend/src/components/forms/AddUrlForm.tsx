import { zodResolver } from "@hookform/resolvers/zod";
import { Globe, Loader2, Plus } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { urlsApi } from "../../services/api/urls";
import type { CreateUrlRequest } from "../../types/url";
import { Button } from "../ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "../ui/form";
import { Input } from "../ui/input";

// Validation schema with Zod
const urlSchema = z.object({
  url: z
    .string()
    .min(1, "URL is required")
    .url("Please enter a valid URL")
    .refine(
      (url) => url.startsWith("http://") || url.startsWith("https://"),
      "URL must start with http:// or https://"
    ),
});

type UrlFormData = z.infer<typeof urlSchema>;

interface AddUrlFormProps {
  onSuccess?: () => void;
  onSubmit?: (data: CreateUrlRequest) => Promise<void>;
  loading?: boolean;
  trigger?: React.ReactNode;
  asDialog?: boolean;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function AddUrlForm({
  onSuccess,
  onSubmit,
  loading: externalLoading = false,
  trigger,
  asDialog = true,
  open: externalOpen,
  onOpenChange: externalOnOpenChange,
}: AddUrlFormProps) {
  const [internalOpen, setInternalOpen] = useState(false);

  // Use external state if provided, otherwise use internal state
  const isOpen = externalOpen !== undefined ? externalOpen : internalOpen;
  const setIsOpen = externalOnOpenChange || setInternalOpen;

  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<UrlFormData>({
    resolver: zodResolver(urlSchema),
    defaultValues: {
      url: "",
    },
  });

  const isLoading = externalLoading || isSubmitting;

  const handleSubmit = async (data: UrlFormData) => {
    setIsSubmitting(true);

    try {
      if (onSubmit) {
        await onSubmit(data);
      } else {
        // Default submission logic
        await urlsApi.createUrl(data);
      }

      // Reset form and close dialog on success
      form.reset();
      setIsOpen(false);
      onSuccess?.();
    } catch (error: any) {
      // Set form error if submission fails
      form.setError("url", {
        type: "manual",
        message: error.message || "Failed to add URL",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUrlBlur = async () => {
    const url = form.getValues("url");
    if (url && !url.startsWith("http://") && !url.startsWith("https://")) {
      // Auto-add https:// if missing
      const correctedUrl = `https://${url}`;
      form.setValue("url", correctedUrl);
      await form.trigger("url");
    }
  };

  const FormContent = () => (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="url"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Website URL</FormLabel>
              <FormControl>
                <div className="relative">
                  <Globe className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="https://example.com"
                    className="pl-10"
                    disabled={isLoading}
                    {...field}
                    onBlur={() => {
                      field.onBlur();
                      handleUrlBlur();
                    }}
                  />
                </div>
              </FormControl>
              <FormDescription>
                Enter the complete URL including http:// or https://
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end space-x-2">
          {asDialog && (
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsOpen(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
          )}
          <Button
            type="submit"
            disabled={isLoading}
            className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors duration-200"
          >
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {!isLoading && <Plus className="mr-2 h-4 w-4" />}
            Add URL
          </Button>
        </div>
      </form>
    </Form>
  );

  if (asDialog) {
    return (
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        {/* Only render trigger if not externally controlled */}
        {externalOpen === undefined && (
          <DialogTrigger asChild>
            {trigger || (
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add URL
              </Button>
            )}
          </DialogTrigger>
        )}
        <DialogContent
          className="sm:max-w-[425px]"
          onOpenAutoFocus={(e) => e.preventDefault()}
          onPointerDownOutside={(e) => {
            if (isLoading) {
              e.preventDefault();
            }
          }}
          onEscapeKeyDown={(e) => {
            if (isLoading) {
              e.preventDefault();
            }
          }}
        >
          <DialogHeader>
            <DialogTitle>Add New URL</DialogTitle>
            <DialogDescription>
              Add a website URL to analyze its structure and find broken links.
            </DialogDescription>
          </DialogHeader>
          <FormContent />
        </DialogContent>
      </Dialog>
    );
  }

  // Standalone form (not in dialog)
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold">Add New URL</h2>
        <p className="text-sm text-gray-600">
          Add a website URL to analyze its structure and find broken links.
        </p>
      </div>
      <FormContent />
    </div>
  );
}

// Simpler inline form for quick URL addition
interface QuickAddUrlFormProps {
  onSubmit: (data: CreateUrlRequest) => Promise<void>;
  loading?: boolean;
  className?: string;
}

export function QuickAddUrlForm({
  onSubmit,
  loading = false,
  className = "",
}: QuickAddUrlFormProps) {
  const [url, setUrl] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isLoading = loading || isSubmitting;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!url.trim()) {
      setError("URL is required");
      return;
    }

    // Auto-correct URL if needed
    let correctedUrl = url.trim();
    if (
      !correctedUrl.startsWith("http://") &&
      !correctedUrl.startsWith("https://")
    ) {
      correctedUrl = `https://${correctedUrl}`;
    }

    // Validate URL
    const validation = urlsApi.validateUrl(correctedUrl);
    if (!validation.isValid) {
      setError(validation.error || "Invalid URL");
      return;
    }

    setIsSubmitting(true);

    try {
      await onSubmit({ url: correctedUrl });
      setUrl("");
      setError("");
    } catch (error: any) {
      setError(error.message || "Failed to add URL");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className={`space-y-2 ${className}`}>
      <div className="flex space-x-2">
        <div className="relative flex-1">
          <Globe className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="https://example.com"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            className="pl-10"
            disabled={isLoading}
          />
        </div>
        <Button type="submit" disabled={isLoading || !url.trim()}>
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Add
        </Button>
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
    </form>
  );
}
