import { useTheme } from "next-themes";
import { Toaster as Sonner, toast } from "sonner";

type ToasterProps = React.ComponentProps<typeof Sonner>;

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme();

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-background/90 group-[.toaster]:backdrop-blur-md group-[.toaster]:text-foreground group-[.toaster]:border-border/50 group-[.toaster]:shadow-2xl rounded-xl p-4 font-sans text-xs border transition-all duration-300",
          description: "group-[.toast]:text-muted-foreground/80 text-[10px] font-medium leading-relaxed mt-0.5",
          actionButton: "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground font-bold rounded-lg text-[10px] h-7 px-3.5",
          cancelButton: "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground font-bold rounded-lg text-[10px] h-7 px-3.5",
          success: "group-[.toaster]:border-emerald-500/20 group-[.toaster]:bg-emerald-500/5 dark:group-[.toaster]:bg-emerald-500/10 group-[.toast]:text-emerald-600 dark:group-[.toast]:text-emerald-400",
          error: "group-[.toaster]:border-destructive/20 group-[.toaster]:bg-destructive/5 dark:group-[.toaster]:bg-destructive/10 group-[.toast]:text-destructive",
          warning: "group-[.toaster]:border-amber-500/20 group-[.toaster]:bg-amber-500/5 dark:group-[.toaster]:bg-amber-500/10 group-[.toast]:text-amber-600 dark:group-[.toast]:text-amber-400",
          info: "group-[.toaster]:border-blue-500/20 group-[.toaster]:bg-blue-500/5 dark:group-[.toaster]:bg-blue-500/10 group-[.toast]:text-blue-600 dark:group-[.toast]:text-blue-400",
        },
      }}
      {...props}
    />
  );
};

export { Toaster, toast };
