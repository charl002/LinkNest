"use client";

import { toast } from "sonner";
import { Button } from "./button";

interface CustomToastProps {
  message: string;
  type?: "success" | "warning" | "error" | "info";
  duration?: number;
}

export function customToast({ message, type = "info", duration = 5000 }: CustomToastProps) {
  const toastFunction = {
    success: toast.success,
    warning: toast.warning,
    error: toast.error,
    info: toast.info,
  }[type];

  toastFunction(
    <div className="flex items-center justify-between w-full">
      <span>{message}</span>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => toast.dismiss()}
        className="absolute top-2 right-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
      >
        ❌
      </Button>
    </div>,
    { duration }
  );
}
