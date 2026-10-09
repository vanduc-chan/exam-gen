// src/components/ui/modal.tsx
import { ReactNode } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { X } from "lucide-react";

interface ModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  children: ReactNode;
  footer?: ReactNode;
}

export function Modal({ open, onOpenChange, title, children, footer }: ModalProps) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        {/* Overlay hoàn toàn trong suốt */}
        <Dialog.Overlay className="fixed inset-0 bg-transparent" />  // overlay trong suốt
        <Dialog.Content className="fixed top-1/2 left-1/2 w-[95%] max-w-lg -translate-x-1/2 -translate-y-1/2 bg-gray-900 p-6 rounded-lg shadow-xl">
          
          {/* Nút X góc trên trái */}
          <Dialog.Close asChild>
            <button
              className="absolute top-2 right-2 p-1 text-gray-400 hover:text-gray-200 rounded-full transition"
              aria-label="Close"
            >
              <X className="h-5 w-5" />
            </button>
          </Dialog.Close>

          {/* Header */}
          {title && <Dialog.Title className="text-lg font-semibold text-center mb-4">{title}</Dialog.Title>}

          {/* Body */}
          <div className="mb-4">{children}</div>

          {/* Footer */}
          {footer && <div className="flex justify-end gap-2">{footer}</div>}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
