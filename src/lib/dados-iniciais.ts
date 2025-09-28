
// Dados iniciais para o sistema de restaurante

import { 
  Restaurante, 
  Usuario, 
  Categoria, 
  UnidadeMedida, 
  Produto,
  Mesa,
  ImpostoConfig,
  HorarioFuncionamento,
  CanalVenda
} from '@/types/sistema-restaurante';
import { prisma } from './prisma';

export async function inicializarDadosIniciais(): Promise<void> {
  try {
    // Verificar se já existe restaurante
    let restaurantePadrao = await prisma.restaurante.findFirst();
    
    if (!restaurantePadrao) {
      // Criar restaurante padrão
      const impostos: ImpostoConfig[] = [
        {
          id: '1',
          nome: 'IVA',
          percentual: 23,
          tipo: 'federal',
          ativo: true
        }
      ];

      const horarioFuncionamento: HorarioFuncionamento[] = [
        { diaSemana: 1, abertura: '08:00', fechamento: '22:00', ativo: true },
        { diaSemana: 2, abertura: '08:00', fechamento: '22:00', ativo: true },
        { diaSemana: 3, abertura: '08:00', fechamento: '22:00', ativo: true },
        { diaSemana: 4, abertura: '08:00', fechamento: '22:00', ativo: true },
        { diaSemana: 5, abertura: '08:00', fechamento: '23:00', ativo: true },
        { diaSemana: 6, abertura: '08:00', fechamento: '23:00', ativo: true },
        { diaSemana: 0, abertura: '09:00', fechamento: '21:00', ativo: true }
      ];

      restaurantePadrao = await prisma.restaurante.create({
        data: {
          nome: 'Restaurante Demo',
          endereco: 'Avenida Julius Nyerere, 123 - Maputo',
          telefone: '+258 84 123 4567',
          email: 'contato@restaurantedemo.mz',
          nuit: '100000000',
          taxaServico: 0.1,
          moeda: 'MZN',
          fusoHorario: 'Africa/Johannesburg'
        }
      });

      // Usuários serão criados via API quando necessário
      console.log('Restaurante demo criado com sucesso');
    }

    // Criar categorias padrão
    const categorias = [
      { nome: 'Entradas', descricao: 'Pratos de entrada', cor: '#ef4444', ordem: 1, ativa: true, restauranteId: restaurantePadrao.id },
      { nome: 'Pratos Principais', descricao: 'Pratos principais', cor: '#3b82f6', ordem: 2, ativa: true, restauranteId: restaurantePadrao.id },
      { nome: 'Sobremesas', descricao: 'Doces e sobremesas', cor: '#f59e0b', ordem: 3, ativa: true, restauranteId: restaurantePadrao.id },
      { nome: 'Bebidas', descricao: 'Bebidas diversas', cor: '#10b981', ordem: 4, ativa: true, restauranteId: restaurantePadrao.id },
      { nome: 'Vinhos', descricao: 'Carta de vinhos', cor: '#8b5cf6', ordem: 5, ativa: true, restauranteId: restaurantePadrao.id }
    ];

    const categoriasIds: Record<string, string> = {};
    for (const categoria of categorias) {
      try {
        // Check if category already exists
        let categoriaSalva = await prisma.categoria.findFirst({
          where: { 
            nome: categoria.nome,
            restauranteId: categoria.restauranteId
          }
        });
        
        if (!categoriaSalva) {
          categoriaSalva = await prisma.categoria.create({
            data: categoria
          });
          console.log(`Categoria ${categoria.nome} criada com sucesso`);
        } else {
          console.log(`Categoria ${categoria.nome} já existe`);
        }
        
        categoriasIds[categoria.nome] = categoriaSalva.id;
      } catch (error) {
        console.log(`Erro ao criar categoria ${categoria.nome}:`, error);
      }
    }

    // Criar unidades de medida padrão se não existirem
    const unidadesMedida = [
      { nome: 'Unidade', sigla: 'un', tipo: 'unidade' as const, fatorConversao: 1.0 },
      { nome: 'Quilograma', sigla: 'kg', tipo: 'peso' as const, fatorConversao: 1.0 },
      { nome: 'Litro', sigla: 'L', tipo: 'volume' as const, fatorConversao: 1.0 }
    ];

    for (const unidade of unidadesMedida) {
      try {
        // Check if unit already exists
        const existing = await prisma.unidadeMedida.findUnique({
          where: { sigla: unidade.sigla }
        });
        
        if (!existing) {
          await prisma.unidadeMedida.create({
            data: unidade
          });
          console.log(`Unidade de medida ${unidade.nome} criada`);
        } else {
          console.log(`Unidade ${unidade.nome} já existe`);
        }
      } catch (error) {
        console.log(`Erro ao criar unidade ${unidade.nome}:`, error);
      }
    }

  // Criar produtos de exemplo
  const produtos = [
    {
      sku: 'ENT001',
      nome: 'Bruschetta Italiana',
      descricao: 'Pão tostado com tomate, manjericão e azeite',
      categoriaId: categoriasIds['Entradas'],
      preco: 8.50,
      custo: 3.20,
      unidadeMedidaId: 'unidade',
      tempoPreparoMinutos: 10,
      disponivel: true,
      controlaEstoque: false,
      ingredientes: [],
      variacoes: [],
      precosPorCanal: [
        { canal: 'balcao' as CanalVenda, preco: 8.50 },
        { canal: 'takeaway' as CanalVenda, preco: 8.00 },
        { canal: 'delivery' as CanalVenda, preco: 9.00 }
      ],
      restauranteId: restaurantePadrao.id
    },
    {
      sku: 'PRIN001',
      nome: 'Bacalhau à Brás',
      descricao: 'Bacalhau desfiado com batata palha e ovos',
      categoriaId: categoriasIds['Pratos Principais'],
      preco: 16.90,
      custo: 8.50,
      unidadeMedidaId: 'unidade',
      tempoPreparoMinutos: 25,
      disponivel: true,
      controlaEstoque: false,
      ingredientes: [],
      variacoes: [],
      precosPorCanal: [
        { canal: 'balcao' as CanalVenda, preco: 16.90 },
        { canal: 'takeaway' as CanalVenda, preco: 15.90 },
        { canal: 'delivery' as CanalVenda, preco: 17.90 }
      ],
      restauranteId: restaurantePadrao.id
    },
    {
      sku: 'PRIN002',
      nome: 'Francesinha',
      descricao: 'Sanduíche tradicional do Porto com molho especial',
      categoriaId: categoriasIds['Pratos Principais'],
      preco: 12.50,
      custo: 6.20,
      unidadeMedidaId: 'unidade',
      tempoPreparoMinutos: 20,
      disponivel: true,
      controlaEstoque: false,
      ingredientes: [],
      variacoes: [],
      precosPorCanal: [
        { canal: 'balcao' as CanalVenda, preco: 12.50 },
        { canal: 'takeaway' as CanalVenda, preco: 11.50 },
        { canal: 'delivery' as CanalVenda, preco: 13.50 }
      ],
      restauranteId: restaurantePadrao.id
    },
    {
      sku: 'SOB001',
      nome: 'Pastel de Nata',
      descricao: 'Tradicional pastel de nata português',
      categoriaId: categoriasIds['Sobremesas'],
      preco: 1.50,
      custo: 0.60,
      unidadeMedidaId: 'unidade',
      tempoPreparoMinutos: 5,
      disponivel: true,
      controlaEstoque: false,
      ingredientes: [],
      variacoes: [],
      precosPorCanal: [
        { canal: 'balcao' as CanalVenda, preco: 1.50 },
        { canal: 'takeaway' as CanalVenda, preco: 1.40 },
        { canal: 'delivery' as CanalVenda, preco: 1.60 }
      ],
      restauranteId: restaurantePadrao.id
    },
    {
      sku: 'BEB001',
      nome: 'Água Natural',
      descricao: 'Água natural 500ml',
      categoriaId: categoriasIds['Bebidas'],
      preco: 2.00,
      custo: 0.80,
      unidadeMedidaId: 'unidade',
      disponivel: true,
      controlaEstoque: true,
      ingredientes: [],
      variacoes: [],
      precosPorCanal: [
        { canal: 'balcao' as CanalVenda, preco: 2.00 },
        { canal: 'takeaway' as CanalVenda, preco: 1.80 },
        { canal: 'delivery' as CanalVenda, preco: 2.20 }
      ],
      restauranteId: restaurantePadrao.id
    },
    {
      sku: 'BEB002',
      nome: 'Café Expresso',
      descricao: 'Café expresso tradicional',
      categoriaId: categoriasIds['Bebidas'],
      preco: 1.20,
      custo: 0.30,
      unidadeMedidaId: 'unidade',
      tempoPreparoMinutos: 3,
      disponivel: true,
      controlaEstoque: false,
      ingredientes: [],
      variacoes: [
        { id: '1', nome: 'Duplo', precoAdicional: 0.50, disponivel: true },
        { id: '2', nome: 'Descafeinado', precoAdicional: 0.00, disponivel: true }
      ],
      precosPorCanal: [
        { canal: 'balcao' as CanalVenda, preco: 1.20 },
        { canal: 'takeaway' as CanalVenda, preco: 1.10 },
        { canal: 'delivery' as CanalVenda, preco: 1.30 }
      ],
      restauranteId: restaurantePadrao.id
    },
    {
      sku: 'VIN001',
      nome: 'Vinho Verde',
      descricao: 'Vinho Verde da região do Minho',
      categoriaId: categoriasIds['Vinhos'],
      preco: 18.00,
      custo: 9.00,
      unidadeMedidaId: 'unidade',
      disponivel: true,
      controlaEstoque: true,
      ingredientes: [],
      variacoes: [],
      precosPorCanal: [
        { canal: 'balcao' as CanalVenda, preco: 18.00 },
        { canal: 'takeaway' as CanalVenda, preco: 16.00 },
        { canal: 'delivery' as CanalVenda, preco: 20.00 }
      ],
      restauranteId: restaurantePadrao.id
    }
  ];

    // Criar produtos de exemplo se não existirem
    const produtosExistentes = await prisma.produto.findMany({
      where: { restauranteId: restaurantePadrao.id }
    });

    if (produtosExistentes.length === 0) {
      // Get the default unit of measurement
      const unidadePadrao = await prisma.unidadeMedida.findFirst({
        where: { sigla: 'un' }
      });

      if (unidadePadrao && Object.keys(categoriasIds).length > 0) {
        for (const produto of produtos) {
          try {
            // Update the product to use the correct unit ID
            const produtoData = {
              ...produto,
              unidadeMedidaId: unidadePadrao.id,
              categoriaId: produto.categoriaId || categoriasIds['Pratos Principais'] // fallback category
            };

            // Remove fields that don't exist in the database schema
            const { precosPorCanal, ingredientes, variacoes, ...produtoSimplificado } = produtoData;

            await prisma.produto.create({
              data: produtoSimplificado
            });
            console.log(`Produto ${produto.nome} criado com sucesso`);
          } catch (error) {
            console.log(`Erro ao criar produto ${produto.nome}:`, error);
          }
        }
      }
    } else {
      console.log('Produtos já existem, pulando criação');
    }

    console.log('Categorias e produtos criados com sucesso');

    // Verificar se já existem mesas
    const mesasExistentes = await prisma.mesa.findMany({
      where: { restauranteId: restaurantePadrao.id }
    });

    if (mesasExistentes.length === 0) {
      // Criar mesas de exemplo
      const mesas = [
      {
        numero: '01',
        capacidade: 4,
        area: 'Balcão Principal',
        status: 'livre' as const,
        restauranteId: restaurantePadrao.id
      },
      {
        numero: '02',
        capacidade: 2,
        area: 'Balcão Principal',
        status: 'livre' as const,
        restauranteId: restaurantePadrao.id
      },
      {
        numero: '03',
        capacidade: 6,
        area: 'Balcão Principal',
        status: 'ocupada' as const,
        restauranteId: restaurantePadrao.id
      },
      {
        numero: '04',
        capacidade: 4,
        area: 'Balcão Principal',
        status: 'reservada' as const,
        restauranteId: restaurantePadrao.id
      },
      {
        numero: 'E1',
        capacidade: 4,
        area: 'Esplanada',
        status: 'livre' as const,
        restauranteId: restaurantePadrao.id
      },
      {
        numero: 'E2',
        capacidade: 6,
        area: 'Esplanada',
        status: 'livre' as const,
        restauranteId: restaurantePadrao.id
      },
      {
        numero: 'E3',
        capacidade: 8,
        area: 'Esplanada',
        status: 'manutencao' as const,
        restauranteId: restaurantePadrao.id
      },
      {
        numero: 'VIP1',
        capacidade: 2,
        area: 'Sala VIP',
        status: 'livre' as const,
        restauranteId: restaurantePadrao.id
      },
      {
        numero: 'VIP2',
        capacidade: 4,
        area: 'Sala VIP',
        status: 'ocupada' as const,
        restauranteId: restaurantePadrao.id
      },
      {
        numero: 'B1',
        capacidade: 1,
        area: 'Bar',
        status: 'livre' as const,
        restauranteId: restaurantePadrao.id
      },
      {
        numero: 'B2',
        capacidade: 1,
        area: 'Bar',
        status: 'livre' as const,
        restauranteId: restaurantePadrao.id
      },
      {
        numero: 'B3',
        capacidade: 1,
        area: 'Bar',
        status: 'ocupada' as const,
        restauranteId: restaurantePadrao.id
      }
    ];

      for (const mesa of mesas) {
        try {
          await prisma.mesa.create({
            data: mesa
          });
          console.log(`Mesa ${mesa.numero} criada com sucesso`);
        } catch (error) {
          console.log(`Mesa ${mesa.numero} já existe ou erro:`, error);
        }
      }
    } else {
      console.log('Mesas já existem, pulando criação');
    }

    console.log('Dados iniciais criados com sucesso!');
  } catch (error) {
    console.error('Erro ao inicializar dados:', error);
  }
}
