
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import {
  Home,
  ShoppingCart,
  Users,
  Package,
  ChefHat,
  BarChart3,
  Settings,
  Truck,
  Receipt,
  Clock,
  Shield,
  Menu,
  X,
  Store,
  TableProperties,
  UtensilsCrossed,
  Warehouse,
  FileText,
  CreditCard,
  Database,
  UserCheck,
  Grid3X3,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

interface ItemNavegacao {
  titulo: string;
  href: string;
  icone: React.ComponentType<{ className?: string }>;
  badge?: string;
  permissoes?: string[];
}

interface GrupoNavegacao {
  titulo: string;
  itens: ItemNavegacao[];
}

const gruposNavegacao: GrupoNavegacao[] = [
  {
    titulo: 'Principal',
    itens: [
      {
        titulo: 'Dashboard',
        href: '/',
        icone: Home,
        permissoes: ['dashboard']
      },
      {
        titulo: 'POS - Vendas',
        href: '/pos',
        icone: ShoppingCart,
        permissoes: ['pos']
      },
      {
        titulo: 'Kitchen Display',
        href: '/kds',
        icone: ChefHat,
        badge: '3',
        permissoes: ['kds']
      }
    ]
  },
  {
    titulo: 'Gestão',
    itens: [
      {
        titulo: 'Mesas',
        href: '/mesas',
        icone: TableProperties,
        permissoes: ['mesas']
      },
      {
        titulo: 'Produtos',
        href: '/produtos',
        icone: Package,
        permissoes: ['produtos']
      },
      {
        titulo: 'Categorias',
        href: '/categorias',
        icone: Grid3X3,
        permissoes: ['categorias']
      },
      {
        titulo: 'Menus',
        href: '/menus',
        icone: UtensilsCrossed,
        permissoes: ['menus']
      },
      {
        titulo: 'Comandas',
        href: '/comandas',
        icone: Receipt,
        permissoes: ['comandas']
      },
      {
        titulo: 'Clientes',
        href: '/clientes',
        icone: UserCheck,
        permissoes: ['clientes']
      }
    ]
  },
  {
    titulo: 'Inventário',
    itens: [
      {
        titulo: 'Estoque',
        href: '/estoque',
        icone: Warehouse,
        permissoes: ['estoque']
      },
      {
        titulo: 'Fornecedores',
        href: '/fornecedores',
        icone: Truck,
        permissoes: ['fornecedores']
      },
      {
        titulo: 'Compras',
        href: '/compras',
        icone: FileText,
        permissoes: ['compras']
      }
    ]
  },
  {
    titulo: 'Financeiro',
    itens: [
      {
        titulo: 'Relatórios',
        href: '/relatorios',
        icone: BarChart3,
        permissoes: ['relatorios']
      },
      {
        titulo: 'Turnos',
        href: '/turnos',
        icone: Clock,
        permissoes: ['turnos']
      },
      {
        titulo: 'Pagamentos',
        href: '/pagamentos',
        icone: CreditCard,
        permissoes: ['pagamentos']
      }
    ]
  },
  {
    titulo: 'Administração',
    itens: [
      {
        titulo: 'Utilizadores',
        href: '/utilizadores',
        icone: Users,
        permissoes: ['utilizadores']
      },
      {
        titulo: 'Restaurante',
        href: '/restaurante',
        icone: Store,
        permissoes: ['restaurante']
      },
      {
        titulo: 'Entregas',
        href: '/entregas',
        icone: Truck,
        permissoes: ['entregas']
      },
      {
        titulo: 'Auditoria',
        href: '/auditoria',
        icone: Shield,
        permissoes: ['auditoria']
      },
      {
        titulo: 'Backup',
        href: '/backup',
        icone: Database,
        permissoes: ['backup']
      },
      {
        titulo: 'Configurações',
        href: '/configuracoes',
        icone: Settings,
        permissoes: ['configuracoes']
      }
    ]
  }
];

interface SidebarNavegacaoProps {
  className?: string;
}

export default function SidebarNavegacao({ className }: SidebarNavegacaoProps) {
  const [aberto, setAberto] = useState(false);
  const [recolhido, setRecolhido] = useState(false);
  const pathname = usePathname();

  // TODO: Implementar verificação de permissões do usuário
  const temPermissao = (permissoes?: string[]): boolean => {
    // Por enquanto, retorna true para todos
    // Implementar lógica de verificação de permissões baseada no usuário logado
    return true;
  };

  const alternarSidebar = () => setAberto(!aberto);

  return (
    <>
      {/* Botão para abrir sidebar no mobile */}
      <Button
        variant="ghost"
        size="icon"
        className="fixed top-4 left-4 z-50 md:hidden"
        onClick={alternarSidebar}
      >
        {aberto ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
      </Button>

      {/* Overlay para mobile */}
      {aberto && (
        <div
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={() => setAberto(false)}
        />
      )}

      {/* Sidebar */}
      <div
        className={cn(
          'fixed left-0 top-0 z-40 h-full transform border-r bg-background transition-all duration-200 ease-in-out md:relative md:translate-x-0',
          aberto ? 'translate-x-0' : '-translate-x-full',
          recolhido ? 'md:w-16' : 'md:w-64',
          'w-64',
          className
        )}
      >
        <div className="flex h-full flex-col">
          {/* Header */}
          <div className="flex h-16 items-center justify-between border-b px-4">
            <div className={cn(
              "flex items-center",
              recolhido && "md:justify-center"
            )}>
              <Store className={cn(
                "h-6 w-6 text-primary",
                !recolhido && "mr-2"
              )} />
              {!recolhido && (
                <span className="text-lg font-semibold">RestaurantePOS</span>
              )}
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="hidden md:flex"
              onClick={() => setRecolhido(!recolhido)}
            >
              {recolhido ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
            </Button>
          </div>

          {/* Navegação */}
          <ScrollArea className="flex-1 px-3 py-4">
            <div className="space-y-6">
              {gruposNavegacao.map((grupo) => (
                <div key={grupo.titulo}>
                  {!recolhido && (
                    <h3 className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      {grupo.titulo}
                    </h3>
                  )}
                  <div className="space-y-1">
                    {grupo.itens
                      .filter((item) => temPermissao(item.permissoes))
                      .map((item) => {
                        const Icone = item.icone;
                        const ativo = pathname === item.href;

                        return (
                          <Link key={item.href} href={item.href}>
                            <Button
                              variant={ativo ? 'secondary' : 'ghost'}
                              className={cn(
                                'w-full',
                                recolhido ? 'md:px-2 md:relative' : 'justify-start',
                                ativo && 'bg-secondary font-medium'
                              )}
                              onClick={() => setAberto(false)}
                              title={recolhido ? item.titulo : undefined}
                            >
                              <Icone className={cn(
                                "h-4 w-4",
                                !recolhido && "mr-2"
                              )} />
                              {!recolhido && (
                                <>
                                  {item.titulo}
                                  {item.badge && (
                                    <Badge
                                      variant="destructive"
                                      className="ml-auto h-5 w-5 rounded-full p-0 text-xs"
                                    >
                                      {item.badge}
                                    </Badge>
                                  )}
                                </>
                              )}
                              {recolhido && item.badge && (
                                <Badge
                                  variant="destructive"
                                  className="absolute -top-1 -right-1 h-4 w-4 rounded-full p-0 text-[10px]"
                                >
                                  {item.badge}
                                </Badge>
                              )}
                            </Button>
                          </Link>
                        );
                      })}
                  </div>
                  {grupo !== gruposNavegacao[gruposNavegacao.length - 1] && (
                    <Separator className="mt-4" />
                  )}
                </div>
              ))}
            </div>
          </ScrollArea>

          {/* Footer */}
          {!recolhido && (
            <div className="border-t p-4">
              <div className="text-xs text-muted-foreground">
                <p>Sistema POS v1.0</p>
                <p>© 2024 RestaurantePOS</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
