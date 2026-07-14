import { useEffect, useRef } from 'react';

interface GoogleLoginButtonProps {
  onSuccess: (credential: string) => void;
  onError?: (error: string) => void;
  isLoading?: boolean;
}

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: {
            client_id: string;
            callback: (response: { credential: string }) => void;
            auto_select?: boolean;
            cancel_on_tap_outside?: boolean;
          }) => void;
          renderButton: (
            element: HTMLElement,
            options: {
              theme?: 'outline' | 'filled_blue' | 'filled_black';
              size?: 'large' | 'medium' | 'small';
              text?: 'signin_with' | 'signup_with' | 'continue_with' | 'signin';
              shape?: 'rectangular' | 'pill' | 'circle' | 'square';
              logo_alignment?: 'left' | 'center';
              width?: number;
              locale?: string;
            }
          ) => void;
          cancel: () => void;
          prompt: () => void;
        };
      };
    };
  }
}

export function GoogleLoginButton({ onSuccess, onError, isLoading }: GoogleLoginButtonProps) {
  const buttonRef = useRef<HTMLDivElement>(null);
  const initializedRef = useRef(false);

  useEffect(() => {
    // Check if Google Identity Services is loaded
    const checkGoogle = () => {
      if (window.google?.accounts && buttonRef.current && !initializedRef.current) {
        initializedRef.current = true;

        window.google.accounts.id.initialize({
          client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID || '',
          callback: (response) => {
            if (response.credential) {
              onSuccess(response.credential);
            } else {
              onError?.('Falha ao obter credencial do Google');
            }
          },
          cancel_on_tap_outside: false,
        });

        window.google.accounts.id.renderButton(buttonRef.current, {
          theme: 'outline',
          size: 'large',
          text: 'signin_with',
          shape: 'rectangular',
          width: 320,
          locale: 'pt-BR',
        });
      }
    };

    // Try immediately if already loaded, otherwise wait
    checkGoogle();
    const interval = setInterval(checkGoogle, 200);

    return () => {
      clearInterval(interval);
      if (window.google?.accounts) {
        window.google.accounts.id.cancel();
      }
    };
  }, [onSuccess, onError]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-3">
        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-gray-600" />
      </div>
    );
  }

  return (
    <div className="flex justify-center">
      <div ref={buttonRef} />
    </div>
  );
}
