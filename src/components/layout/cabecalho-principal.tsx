
'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ThemeToggle } from '@/components/ThemeToggle';
import { Bell, User, LogOut, Settings, Clock } from 'lucide-react';
import { ArmazenamentoLocal } from '@/lib/armazenamento-local';
import { Usuario } from '@/types/sistema-restaurante';

interface CabecalhoPrincipalProps {
  titulo?: string;
}

export default function CabecalhoPrincipal({ titulo }: CabecalhoPrincipalProps) {
  const [usuarioLogado, setUsuarioLogado] = useState<Usuario | null>(null);
  const [horaAtual, setHoraAtual] = useState<string>('');

  useEffect(() => {
    // Carregar usuário logado
    const usuario = ArmazenamentoLocal.obterUsuarioLogado();
    setUsuarioLogado(usuario);

    // Atualizar hora a cada segundo
    const atualizarHora = () => {
      const agora = new Date();
      setHoraAtual(
        agora.toLocaleTimeString('pt-PT', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit'
        })
      );
    };

    atualizarHora();
    const intervalo = setInterval(atualizarHora, 1000);

    return () => clearInterval(intervalo);
  }, []);

  const obterIniciais = (nome: string): string => {
    return nome
      .split(' ')
      .map(parte => parte[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const obterCorPerfil = (perfil: string): string => {
    const cores: Record<string, string> = {
      admin: 'bg-red-500',
      gestor: 'bg-blue-500',
      caixa: 'bg-green-500',
      garcom: 'bg-yellow-500',
      cozinha: 'bg-orange-500',
      estoquista: 'bg-purple-500'
    };
    return cores[perfil] || 'bg-gray-500';
  };

  const formatarPerfil = (perfil: string): string => {
    const perfis: Record<string, string> = {
      admin: 'Administrador',
      gestor: 'Gestor',
      caixa: 'Caixa',
      garcom: 'Garçom',
      cozinha: 'Cozinha',
      estoquista: 'Estoquista'
    };
    return perfis[perfil] || perfil;
  };

  const handleLogout = () => {
    ArmazenamentoLocal.logout();
    window.location.href = '/login';
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-6">
      {/* Título da página */}
      <div className="flex items-center space-x-4">
        {titulo && (
          <h1 className="text-xl font-semibold text-foreground">{titulo}</h1>
        )}
      </div>

      {/* Área direita - Hora, notificações e usuário */}
      <div className="flex items-center space-x-4">
        {/* Relógio */}
        <div className="hidden md:flex items-center space-x-2 text-sm text-muted-foreground">
          <Clock className="h-4 w-4" />
          <span className="font-mono">{horaAtual}</span>
        </div>

        {/* Notificações */}
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-4 w-4" />
          <Badge
            variant="destructive"
            className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 text-xs"
          >
            3
          </Badge>
        </Button>

        {/* Toggle de tema */}
        <ThemeToggle />

        {/* Menu do usuário */}
        {usuarioLogado && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                <Avatar className="h-8 w-8">
                  <AvatarImage src="" alt={usuarioLogado.nome} />
                  <AvatarFallback className={obterCorPerfil(usuarioLogado.perfil)}>
                    {obterIniciais(usuarioLogado.nome)}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">
                    {usuarioLogado.nome}
                  </p>
                  <p className="text-xs leading-none text-muted-foreground">
                    {usuarioLogado.email}
                  </p>
                  <Badge
                    variant="secondary"
                    className="w-fit text-xs"
                  >
                    {formatarPerfil(usuarioLogado.perfil)}
                  </Badge>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <User className="mr-2 h-4 w-4" />
                <span>Perfil</span>
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Settings className="mr-2 h-4 w-4" />
                <span>Configurações</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout}>
                <LogOut className="mr-2 h-4 w-4" />
                <span>Sair</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </header>
  );
}
