import jtLogo from "@/assets/jt-logo.png.asset.json";
import { cn } from "@/lib/utils";

type Size = "sm" | "md" | "lg" | "xl";

const sizes: Record<Size, { img: string; text: string }> = {
  sm: { img: "h-9 w-9", text: "text-base" },
  md: { img: "h-11 w-11", text: "text-lg" },
  lg: { img: "h-14 w-14 md:h-16 md:w-16", text: "text-xl md:text-2xl" },
  xl: { img: "h-20 w-20 md:h-24 md:w-24", text: "text-2xl md:text-3xl" },
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
        src={jtLogo.url}
        alt="JT — JobTrack-AI logo"
        className={cn("shrink-0 select-none object-contain", s.img)}
        loading="eager"
      />
      {showText && (
        <span className={cn("font-display font-bold tracking-tight", s.text)}>{brand}</span>
      )}
    </span>
  );
}
