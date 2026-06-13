import jtLogo from "@/assets/jt-logo.png";
import { cn } from "@/lib/utils";

type Size = "sm" | "md" | "lg" | "xl";

const sizes: Record<Size, { img: string; text: string }> = {
  sm: { img: "h-8 w-8", text: "text-base" },
  md: { img: "h-10 w-10", text: "text-lg" },
  lg: { img: "h-12 w-12 md:h-14 md:w-14", text: "text-xl md:text-2xl" },
  xl: { img: "h-16 w-16 md:h-20 md:w-20", text: "text-2xl md:text-3xl" },
};

export function JTLogo({
  size = "lg",
  showText = true,
  className,
  brand = "JobTrack-AI",
}: {
  size?: Size;
  showText?: boolean;
  className?: string;
  brand?: string;
}) {
  const s = sizes[size];
  return (
    <span className={cn("flex items-center gap-3", className)}>
      <img
        src={jtLogo}
        alt="JT — JobTrack-AI logo"
        width={512}
        height={512}
        className={cn("shrink-0 select-none drop-shadow-[0_4px_14px_rgba(37,99,235,0.35)]", s.img)}
        loading="eager"
      />
      {showText && (
        <span className={cn("font-display font-bold tracking-tight", s.text)}>{brand}</span>
      )}
    </span>
  );
}
