'use client';

import LayoutPrincipal from '@/components/layout/layout-principal';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function PaginaRestaurante() {
  return (
    <LayoutPrincipal titulo="Configurações do Restaurante">
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Restaurante</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Esta página está sendo migrada para usar a base de dados.
            </p>
          </CardContent>
        </Card>
      </div>
    </LayoutPrincipal>
  );
}