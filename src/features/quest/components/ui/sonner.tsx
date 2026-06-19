"use client";

import { useTheme } from "next-themes";
import { Toaster as Sonner, type ToasterProps } from "sonner";

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme();

  return (
    <Sonner
      theme={(theme as ToasterProps["theme"]) || "system"}
      className="toaster group"
      toastOptions={{
        classNames: {
          toast: [
            "group toast !rounded-[14px]",
            "group-[.toaster]:!bg-black",
            "group-[.toaster]:!text-[#F4F7FB]",
            "group-[.toaster]:!border-white/[0.14]",
            "group-[.toaster]:!shadow-[0_24px_60px_-20px_rgba(0,0,0,0.9),0_0_40px_-20px_rgba(103,232,249,0.55)]",
            "group-[.toaster]:!backdrop-blur-xl",
          ].join(" "),
          description: "group-[.toast]:!text-[rgba(244,247,251,0.58)]",
          actionButton:
            "group-[.toast]:!bg-[rgba(103,232,249,0.14)] group-[.toast]:!text-[#67E8F9] group-[.toast]:!border-[rgba(103,232,249,0.3)] font-semibold",
          cancelButton:
            "group-[.toast]:!bg-white/[0.06] group-[.toast]:!text-[rgba(244,247,251,0.58)] font-medium",
          error:
            "group-[.toaster]:!border-[rgba(248,113,113,0.3)] group-[.toaster]:!text-[#F87171]",
          success:
            "group-[.toaster]:!border-[rgba(110,231,183,0.3)] group-[.toaster]:!text-[#6EE7B7]",
          warning:
            "group-[.toaster]:!border-[rgba(252,211,77,0.3)] group-[.toaster]:!text-[#FCD34D]",
        },
      }}
      {...props}
    />
  );
};

export { Toaster };
