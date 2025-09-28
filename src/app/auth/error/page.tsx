'use client';

import { useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

const errorMessages = {
  Configuration: 'Erro de configuração do servidor.',
  AccessDenied: 'Acesso negado. Você não tem permissão para acessar este recurso.',
  Verification: 'Erro de verificação. O token pode ter expirado.',
  Default: 'Ocorreu um erro durante a autenticação.',
};

export default function AuthErrorPage() {
  const searchParams = useSearchParams();
  const error = searchParams.get('error') as keyof typeof errorMessages;
  
  const errorMessage = errorMessages[error] || errorMessages.Default;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-orange-100 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-destructive rounded-full">
              <AlertTriangle className="h-8 w-8 text-destructive-foreground" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold text-center">
            Erro de Autenticação
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert variant="destructive">
            <AlertDescription>{errorMessage}</AlertDescription>
          </Alert>
          
          <div className="flex flex-col space-y-2">
            <Button asChild>
              <Link href="/auth/signin">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Voltar ao Login
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}