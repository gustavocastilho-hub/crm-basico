interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  zIndex?: number;
}

export function Modal({ open, onClose, title, children, zIndex = 50 }: ModalProps) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 flex items-end sm:items-center justify-center bg-black/50"
      style={{ zIndex }}
      onClick={onClose}
    >
      <div
        className="bg-white w-full sm:max-w-lg sm:mx-4 rounded-t-xl sm:rounded-xl shadow-xl max-h-[100dvh] sm:max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 border-b border-gray-200 sticky top-0 bg-white">
          <h2 className="text-lg font-semibold">{title}</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl leading-none px-2"
            aria-label="Fechar"
          >
            &times;
          </button>
        </div>
        <div className="p-4">{children}</div>
      </div>
    </div>
  );
}
