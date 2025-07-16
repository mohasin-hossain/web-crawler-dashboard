import { zodResolver } from "@hookform/resolvers/zod";
import { Globe, Loader2, Plus, XCircle } from "lucide-react";
import {
  forwardRef,
  useCallback,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { NOTIFICATIONS } from "../../lib/constants";
import { handleFormError } from "../../lib/errorHandling";
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
import { ParticleButton } from "../ui/particle-button";

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

  const handleSubmit = useCallback(
    async (data: UrlFormData) => {
      setIsSubmitting(true);
      try {
        if (onSubmit) {
          await onSubmit(data);
        } else {
          await urlsApi.createUrl(data);
        }
        form.reset();
        setIsOpen(false);
        onSuccess?.();
      } catch (error: unknown) {
        const errorMessage = handleFormError(error, form.setError as unknown as (field: string, message: string) => void);
        form.setError("url", { type: "manual", message: errorMessage });
        toast.error(errorMessage, {
          duration: NOTIFICATIONS.TOAST_DURATION.NORMAL,
        });
      } finally {
        setIsSubmitting(false);
      }
    },
    [onSubmit, urlsApi, form, setIsOpen, onSuccess]
  );

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
          <ParticleButton
            type="submit"
            disabled={isLoading}
            className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors duration-200"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Adding...
              </>
            ) : (
              <>
                <Plus className="mr-2 h-4 w-4" />
                Add URL
              </>
            )}
          </ParticleButton>
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

export const QuickAddUrlForm = forwardRef<
  HTMLInputElement,
  QuickAddUrlFormProps
>(function QuickAddUrlForm({ onSubmit, loading = false, className = "" }, ref) {
  const [url, setUrl] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useImperativeHandle(ref, () => inputRef.current as HTMLInputElement);

  const isLoading = loading || isSubmitting;

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setError("");
      if (!url.trim()) {
        setError("URL is required");
        return;
      }
      let correctedUrl = url.trim();
      if (
        !correctedUrl.startsWith("http://") &&
        !correctedUrl.startsWith("https://")
      ) {
        correctedUrl = `https://${correctedUrl}`;
      }
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
      } catch (error: unknown) {
        const errorMessage = handleFormError(error);
        setError(errorMessage);
        toast.error(errorMessage, {
          duration: NOTIFICATIONS.TOAST_DURATION.NORMAL,
        });
      } finally {
        setIsSubmitting(false);
      }
    },
    [onSubmit, url, urlsApi]
  );

  return (
    <form onSubmit={handleSubmit} className={`space-y-3 ${className}`}>
      {/* Mobile Layout */}
      <div className="block sm:hidden space-y-2">
        <div className="relative">
          <Globe className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            ref={inputRef}
            placeholder="https://example.com"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            className="pl-8 h-8 text-sm border border-gray-200 rounded-md bg-gray-50 focus:bg-white focus:border-blue-400 transition-all shadow-none"
            disabled={isLoading}
          />
        </div>
        <ParticleButton
          type="submit"
          disabled={isLoading || !url.trim()}
          className="w-full h-8 text-sm border border-gray-200 rounded-md bg-blue-600 hover:bg-blue-700 active:bg-blue-800 font-semibold shadow-none flex items-center justify-center"
          variant="default"
          size="lg"
          onSuccess={() => {
            // Optional: Add any success feedback here
          }}
          successDuration={800}
        >
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Adding...
            </>
          ) : (
            <>
              <Plus className="h-4 w-4 mr-2" />
              Add URL
            </>
          )}
        </ParticleButton>
      </div>

      {/* Tablet and Desktop Layout (side by side) */}
      <div className="hidden sm:flex sm:flex-row sm:space-x-3">
        <div className="relative flex-1">
          <Globe className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            ref={inputRef}
            placeholder="https://example.com"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            className="pl-8 h-9 text-base border border-gray-200 rounded-md bg-gray-50 focus:bg-white focus:border-blue-400 transition-all shadow-none pr-28"
            disabled={isLoading}
          />
          {/* Keyboard shortcut only on lg+ */}
          <div className="hidden lg:flex absolute right-2 top-1/2 -translate-y-1/2 items-center space-x-1 pointer-events-none">
            <kbd className="rounded bg-gray-100 border px-1 text-xs text-gray-500 font-mono">
              Ctrl
            </kbd>
            <span className="text-xs text-gray-400">+</span>
            <kbd className="rounded bg-gray-100 border px-1 text-xs text-gray-500 font-mono">
              Shift
            </kbd>
            <span className="text-xs text-gray-400">+</span>
            <kbd className="rounded bg-gray-100 border px-1 text-xs text-gray-500 font-mono">
              A
            </kbd>
          </div>
        </div>
        <ParticleButton
          type="submit"
          disabled={isLoading || !url.trim()}
          className="h-9 px-6 text-base border border-gray-200 rounded-md bg-blue-600 hover:bg-blue-700 active:bg-blue-800 font-semibold shadow-none flex items-center w-full sm:w-auto mt-2 sm:mt-0"
          variant="default"
          size="lg"
          onSuccess={() => {
            // Optional: Add any success feedback here
          }}
          successDuration={800}
        >
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Adding...
            </>
          ) : (
            <>
              <Plus className="h-4 w-4 mr-2" />
              Add URL
            </>
          )}
        </ParticleButton>
      </div>
      {error && (
        <div className="flex items-start space-x-2 p-3 bg-red-50 border border-red-200 rounded-lg">
          <XCircle className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}
    </form>
  );
});
