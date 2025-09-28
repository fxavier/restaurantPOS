-- CreateEnum
CREATE TYPE "public"."TipoImposto" AS ENUM ('federal', 'estadual', 'municipal');

-- CreateEnum
CREATE TYPE "public"."PerfilUsuario" AS ENUM ('admin', 'gestor', 'caixa', 'garcom', 'cozinha', 'estoquista');

-- CreateEnum
CREATE TYPE "public"."StatusMesa" AS ENUM ('livre', 'ocupada', 'reservada', 'manutencao');

-- CreateEnum
CREATE TYPE "public"."TipoUnidadeMedida" AS ENUM ('peso', 'volume', 'unidade');

-- CreateEnum
CREATE TYPE "public"."CanalVenda" AS ENUM ('salao', 'takeaway', 'delivery');

-- CreateEnum
CREATE TYPE "public"."PeriodoMenu" AS ENUM ('cafe', 'almoco', 'jantar', 'lanche', 'personalizado');

-- CreateEnum
CREATE TYPE "public"."StatusComanda" AS ENUM ('aberta', 'enviada', 'preparando', 'pronta', 'entregue', 'paga', 'cancelada');

-- CreateEnum
CREATE TYPE "public"."StatusItemComanda" AS ENUM ('pendente', 'preparando', 'pronto', 'entregue', 'cancelado');

-- CreateEnum
CREATE TYPE "public"."MetodoPagamento" AS ENUM ('dinheiro', 'cartao_debito', 'cartao_credito', 'pix', 'mbway', 'vale_refeicao');

-- CreateEnum
CREATE TYPE "public"."StatusPagamento" AS ENUM ('pendente', 'processando', 'aprovado', 'rejeitado', 'cancelado');

-- CreateEnum
CREATE TYPE "public"."TipoMovimentacao" AS ENUM ('entrada', 'saida', 'ajuste', 'transferencia', 'perda');

-- CreateEnum
CREATE TYPE "public"."StatusOrdemCompra" AS ENUM ('rascunho', 'enviada', 'confirmada', 'recebida', 'cancelada');

-- CreateEnum
CREATE TYPE "public"."StatusEntrega" AS ENUM ('pendente', 'preparando', 'saiu_entrega', 'entregue', 'cancelada');

-- CreateEnum
CREATE TYPE "public"."TipoAcaoAuditoria" AS ENUM ('criar', 'editar', 'excluir', 'login', 'logout', 'erro');

-- CreateEnum
CREATE TYPE "public"."StatusTurno" AS ENUM ('aberto', 'fechado');

-- CreateTable
CREATE TABLE "public"."restaurantes" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "endereco" TEXT NOT NULL,
    "telefone" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "cnpj" TEXT NOT NULL,
    "inscricaoEstadual" TEXT,
    "inscricaoMunicipal" TEXT,
    "taxaServico" DOUBLE PRECISION NOT NULL DEFAULT 0.1,
    "moeda" TEXT NOT NULL DEFAULT 'EUR',
    "fusoHorario" TEXT NOT NULL DEFAULT 'Europe/Lisbon',
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "restaurantes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."impostos_config" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "percentual" DOUBLE PRECISION NOT NULL,
    "tipo" "public"."TipoImposto" NOT NULL,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "restauranteId" TEXT NOT NULL,

    CONSTRAINT "impostos_config_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."horarios_funcionamento" (
    "id" TEXT NOT NULL,
    "diaSemana" INTEGER NOT NULL,
    "abertura" TEXT NOT NULL,
    "fechamento" TEXT NOT NULL,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "restauranteId" TEXT NOT NULL,

    CONSTRAINT "horarios_funcionamento_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."usuarios" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "telefone" TEXT,
    "perfil" "public"."PerfilUsuario" NOT NULL,
    "permissoes" TEXT[],
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "ultimoLogin" TIMESTAMP(3),
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,
    "restauranteId" TEXT NOT NULL,

    CONSTRAINT "usuarios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."mesas" (
    "id" TEXT NOT NULL,
    "numero" TEXT NOT NULL,
    "capacidade" INTEGER NOT NULL,
    "area" TEXT NOT NULL,
    "qrCode" TEXT,
    "status" "public"."StatusMesa" NOT NULL DEFAULT 'livre',
    "criadaEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "restauranteId" TEXT NOT NULL,

    CONSTRAINT "mesas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."categorias" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "descricao" TEXT,
    "cor" TEXT NOT NULL DEFAULT '#3B82F6',
    "icone" TEXT,
    "ordem" INTEGER NOT NULL DEFAULT 0,
    "ativa" BOOLEAN NOT NULL DEFAULT true,
    "restauranteId" TEXT NOT NULL,

    CONSTRAINT "categorias_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."unidades_medida" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "sigla" TEXT NOT NULL,
    "tipo" "public"."TipoUnidadeMedida" NOT NULL,
    "fatorConversao" DOUBLE PRECISION NOT NULL DEFAULT 1.0,

    CONSTRAINT "unidades_medida_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."produtos" (
    "id" TEXT NOT NULL,
    "sku" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "descricao" TEXT,
    "imagem" TEXT,
    "preco" DOUBLE PRECISION NOT NULL,
    "custo" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "tempoPreparoMinutos" INTEGER,
    "disponivel" BOOLEAN NOT NULL DEFAULT true,
    "controlaEstoque" BOOLEAN NOT NULL DEFAULT false,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,
    "categoriaId" TEXT NOT NULL,
    "unidadeMedidaId" TEXT NOT NULL,
    "restauranteId" TEXT NOT NULL,

    CONSTRAINT "produtos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ingredientes_produto" (
    "id" TEXT NOT NULL,
    "quantidade" DOUBLE PRECISION NOT NULL,
    "obrigatorio" BOOLEAN NOT NULL DEFAULT true,
    "produtoId" TEXT NOT NULL,
    "ingredienteId" TEXT NOT NULL,
    "unidadeMedidaId" TEXT NOT NULL,

    CONSTRAINT "ingredientes_produto_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."variacoes_produto" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "precoAdicional" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "disponivel" BOOLEAN NOT NULL DEFAULT true,
    "produtoId" TEXT NOT NULL,

    CONSTRAINT "variacoes_produto_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."precos_por_canal" (
    "id" TEXT NOT NULL,
    "canal" "public"."CanalVenda" NOT NULL,
    "preco" DOUBLE PRECISION NOT NULL,
    "produtoId" TEXT NOT NULL,

    CONSTRAINT "precos_por_canal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."menus" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "descricao" TEXT,
    "periodo" "public"."PeriodoMenu" NOT NULL,
    "horarioInicio" TEXT NOT NULL,
    "horarioFim" TEXT NOT NULL,
    "diasSemana" INTEGER[],
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "restauranteId" TEXT NOT NULL,

    CONSTRAINT "menus_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."menus_produtos" (
    "id" TEXT NOT NULL,
    "menuId" TEXT NOT NULL,
    "produtoId" TEXT NOT NULL,

    CONSTRAINT "menus_produtos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."comandas" (
    "id" TEXT NOT NULL,
    "numero" TEXT NOT NULL,
    "clienteNome" TEXT,
    "clienteTelefone" TEXT,
    "subtotal" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "taxaServico" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "impostos" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "desconto" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "total" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "status" "public"."StatusComanda" NOT NULL DEFAULT 'aberta',
    "canal" "public"."CanalVenda" NOT NULL DEFAULT 'salao',
    "observacoes" TEXT,
    "criadaEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadaEm" TIMESTAMP(3) NOT NULL,
    "finalizadaEm" TIMESTAMP(3),
    "mesaId" TEXT,
    "garcomId" TEXT NOT NULL,
    "restauranteId" TEXT NOT NULL,

    CONSTRAINT "comandas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."itens_comanda" (
    "id" TEXT NOT NULL,
    "produtoNome" TEXT NOT NULL,
    "quantidade" INTEGER NOT NULL,
    "precoUnitario" DOUBLE PRECISION NOT NULL,
    "precoTotal" DOUBLE PRECISION NOT NULL,
    "observacoes" TEXT,
    "status" "public"."StatusItemComanda" NOT NULL DEFAULT 'pendente',
    "tempoPreparoEstimado" INTEGER,
    "iniciadoPreparoEm" TIMESTAMP(3),
    "prontoEm" TIMESTAMP(3),
    "comandaId" TEXT NOT NULL,
    "produtoId" TEXT NOT NULL,

    CONSTRAINT "itens_comanda_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."variacoes_selecionadas" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "precoAdicional" DOUBLE PRECISION NOT NULL,
    "itemComandaId" TEXT NOT NULL,
    "variacaoId" TEXT NOT NULL,

    CONSTRAINT "variacoes_selecionadas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."pagamentos" (
    "id" TEXT NOT NULL,
    "valor" DOUBLE PRECISION NOT NULL,
    "metodoPagamento" "public"."MetodoPagamento" NOT NULL,
    "status" "public"."StatusPagamento" NOT NULL DEFAULT 'pendente',
    "referencia" TEXT,
    "processadoEm" TIMESTAMP(3),
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "comandaId" TEXT NOT NULL,

    CONSTRAINT "pagamentos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."movimentacoes_estoque" (
    "id" TEXT NOT NULL,
    "tipo" "public"."TipoMovimentacao" NOT NULL,
    "quantidade" DOUBLE PRECISION NOT NULL,
    "valorUnitario" DOUBLE PRECISION,
    "valorTotal" DOUBLE PRECISION,
    "motivo" TEXT NOT NULL,
    "documentoReferencia" TEXT,
    "criadaEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "produtoId" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "unidadeMedidaId" TEXT NOT NULL,

    CONSTRAINT "movimentacoes_estoque_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."fornecedores" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "cnpj" TEXT,
    "contato" TEXT NOT NULL,
    "telefone" TEXT,
    "email" TEXT,
    "endereco" TEXT,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "restauranteId" TEXT NOT NULL,

    CONSTRAINT "fornecedores_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ordens_compra" (
    "id" TEXT NOT NULL,
    "numero" TEXT NOT NULL,
    "subtotal" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "impostos" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "total" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "status" "public"."StatusOrdemCompra" NOT NULL DEFAULT 'rascunho',
    "dataEntregaPrevista" TIMESTAMP(3),
    "observacoes" TEXT,
    "criadaEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadaEm" TIMESTAMP(3) NOT NULL,
    "fornecedorId" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "restauranteId" TEXT NOT NULL,

    CONSTRAINT "ordens_compra_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."itens_ordem_compra" (
    "id" TEXT NOT NULL,
    "produtoNome" TEXT NOT NULL,
    "quantidade" DOUBLE PRECISION NOT NULL,
    "precoUnitario" DOUBLE PRECISION NOT NULL,
    "precoTotal" DOUBLE PRECISION NOT NULL,
    "quantidadeRecebida" DOUBLE PRECISION,
    "ordemCompraId" TEXT NOT NULL,
    "produtoId" TEXT NOT NULL,
    "unidadeMedidaId" TEXT NOT NULL,

    CONSTRAINT "itens_ordem_compra_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."entregas" (
    "id" TEXT NOT NULL,
    "numero" TEXT NOT NULL,
    "comandaNumero" TEXT NOT NULL,
    "clienteNome" TEXT NOT NULL,
    "clienteTelefone" TEXT NOT NULL,
    "entregadorNome" TEXT NOT NULL,
    "entregadorTelefone" TEXT NOT NULL,
    "enderecoEntrega" TEXT NOT NULL,
    "observacoes" TEXT,
    "taxaEntrega" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "valorTotal" DOUBLE PRECISION NOT NULL,
    "tempoEstimado" INTEGER NOT NULL,
    "status" "public"."StatusEntrega" NOT NULL DEFAULT 'pendente',
    "dataEntrega" TIMESTAMP(3),
    "criadaEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadaEm" TIMESTAMP(3) NOT NULL,
    "comandaId" TEXT NOT NULL,
    "restauranteId" TEXT NOT NULL,

    CONSTRAINT "entregas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."entregadores" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "telefone" TEXT NOT NULL,
    "veiculo" TEXT NOT NULL,
    "placa" TEXT,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "restauranteId" TEXT NOT NULL,

    CONSTRAINT "entregadores_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."logs_auditoria" (
    "id" TEXT NOT NULL,
    "usuarioNome" TEXT NOT NULL,
    "acao" "public"."TipoAcaoAuditoria" NOT NULL,
    "entidade" TEXT NOT NULL,
    "entidadeId" TEXT NOT NULL,
    "detalhes" TEXT NOT NULL,
    "dadosAnteriores" JSONB,
    "dadosNovos" JSONB,
    "ip" TEXT,
    "userAgent" TEXT,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "usuarioId" TEXT NOT NULL,
    "restauranteId" TEXT NOT NULL,

    CONSTRAINT "logs_auditoria_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."turnos_fechamento" (
    "id" TEXT NOT NULL,
    "dataAbertura" TIMESTAMP(3) NOT NULL,
    "dataFechamento" TIMESTAMP(3),
    "valorAbertura" DOUBLE PRECISION NOT NULL,
    "valorFechamento" DOUBLE PRECISION,
    "totalVendas" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalDinheiro" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalCartao" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalOutros" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "diferencaCaixa" DOUBLE PRECISION,
    "observacoes" TEXT,
    "status" "public"."StatusTurno" NOT NULL DEFAULT 'aberto',
    "usuarioId" TEXT NOT NULL,
    "restauranteId" TEXT NOT NULL,

    CONSTRAINT "turnos_fechamento_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "restaurantes_cnpj_key" ON "public"."restaurantes"("cnpj");

-- CreateIndex
CREATE UNIQUE INDEX "usuarios_email_key" ON "public"."usuarios"("email");

-- CreateIndex
CREATE UNIQUE INDEX "mesas_numero_restauranteId_key" ON "public"."mesas"("numero", "restauranteId");

-- CreateIndex
CREATE UNIQUE INDEX "unidades_medida_sigla_key" ON "public"."unidades_medida"("sigla");

-- CreateIndex
CREATE UNIQUE INDEX "produtos_sku_key" ON "public"."produtos"("sku");

-- CreateIndex
CREATE UNIQUE INDEX "precos_por_canal_produtoId_canal_key" ON "public"."precos_por_canal"("produtoId", "canal");

-- CreateIndex
CREATE UNIQUE INDEX "menus_produtos_menuId_produtoId_key" ON "public"."menus_produtos"("menuId", "produtoId");

-- CreateIndex
CREATE UNIQUE INDEX "comandas_numero_key" ON "public"."comandas"("numero");

-- CreateIndex
CREATE UNIQUE INDEX "ordens_compra_numero_key" ON "public"."ordens_compra"("numero");

-- CreateIndex
CREATE UNIQUE INDEX "entregas_numero_key" ON "public"."entregas"("numero");

-- AddForeignKey
ALTER TABLE "public"."impostos_config" ADD CONSTRAINT "impostos_config_restauranteId_fkey" FOREIGN KEY ("restauranteId") REFERENCES "public"."restaurantes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."horarios_funcionamento" ADD CONSTRAINT "horarios_funcionamento_restauranteId_fkey" FOREIGN KEY ("restauranteId") REFERENCES "public"."restaurantes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."usuarios" ADD CONSTRAINT "usuarios_restauranteId_fkey" FOREIGN KEY ("restauranteId") REFERENCES "public"."restaurantes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."mesas" ADD CONSTRAINT "mesas_restauranteId_fkey" FOREIGN KEY ("restauranteId") REFERENCES "public"."restaurantes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."categorias" ADD CONSTRAINT "categorias_restauranteId_fkey" FOREIGN KEY ("restauranteId") REFERENCES "public"."restaurantes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."produtos" ADD CONSTRAINT "produtos_categoriaId_fkey" FOREIGN KEY ("categoriaId") REFERENCES "public"."categorias"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."produtos" ADD CONSTRAINT "produtos_unidadeMedidaId_fkey" FOREIGN KEY ("unidadeMedidaId") REFERENCES "public"."unidades_medida"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."produtos" ADD CONSTRAINT "produtos_restauranteId_fkey" FOREIGN KEY ("restauranteId") REFERENCES "public"."restaurantes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ingredientes_produto" ADD CONSTRAINT "ingredientes_produto_produtoId_fkey" FOREIGN KEY ("produtoId") REFERENCES "public"."produtos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ingredientes_produto" ADD CONSTRAINT "ingredientes_produto_ingredienteId_fkey" FOREIGN KEY ("ingredienteId") REFERENCES "public"."produtos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ingredientes_produto" ADD CONSTRAINT "ingredientes_produto_unidadeMedidaId_fkey" FOREIGN KEY ("unidadeMedidaId") REFERENCES "public"."unidades_medida"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."variacoes_produto" ADD CONSTRAINT "variacoes_produto_produtoId_fkey" FOREIGN KEY ("produtoId") REFERENCES "public"."produtos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."precos_por_canal" ADD CONSTRAINT "precos_por_canal_produtoId_fkey" FOREIGN KEY ("produtoId") REFERENCES "public"."produtos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."menus" ADD CONSTRAINT "menus_restauranteId_fkey" FOREIGN KEY ("restauranteId") REFERENCES "public"."restaurantes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."menus_produtos" ADD CONSTRAINT "menus_produtos_menuId_fkey" FOREIGN KEY ("menuId") REFERENCES "public"."menus"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."menus_produtos" ADD CONSTRAINT "menus_produtos_produtoId_fkey" FOREIGN KEY ("produtoId") REFERENCES "public"."produtos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."comandas" ADD CONSTRAINT "comandas_mesaId_fkey" FOREIGN KEY ("mesaId") REFERENCES "public"."mesas"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."comandas" ADD CONSTRAINT "comandas_garcomId_fkey" FOREIGN KEY ("garcomId") REFERENCES "public"."usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."comandas" ADD CONSTRAINT "comandas_restauranteId_fkey" FOREIGN KEY ("restauranteId") REFERENCES "public"."restaurantes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."itens_comanda" ADD CONSTRAINT "itens_comanda_comandaId_fkey" FOREIGN KEY ("comandaId") REFERENCES "public"."comandas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."itens_comanda" ADD CONSTRAINT "itens_comanda_produtoId_fkey" FOREIGN KEY ("produtoId") REFERENCES "public"."produtos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."variacoes_selecionadas" ADD CONSTRAINT "variacoes_selecionadas_itemComandaId_fkey" FOREIGN KEY ("itemComandaId") REFERENCES "public"."itens_comanda"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."variacoes_selecionadas" ADD CONSTRAINT "variacoes_selecionadas_variacaoId_fkey" FOREIGN KEY ("variacaoId") REFERENCES "public"."variacoes_produto"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."pagamentos" ADD CONSTRAINT "pagamentos_comandaId_fkey" FOREIGN KEY ("comandaId") REFERENCES "public"."comandas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."movimentacoes_estoque" ADD CONSTRAINT "movimentacoes_estoque_produtoId_fkey" FOREIGN KEY ("produtoId") REFERENCES "public"."produtos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."movimentacoes_estoque" ADD CONSTRAINT "movimentacoes_estoque_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "public"."usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."movimentacoes_estoque" ADD CONSTRAINT "movimentacoes_estoque_unidadeMedidaId_fkey" FOREIGN KEY ("unidadeMedidaId") REFERENCES "public"."unidades_medida"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."fornecedores" ADD CONSTRAINT "fornecedores_restauranteId_fkey" FOREIGN KEY ("restauranteId") REFERENCES "public"."restaurantes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ordens_compra" ADD CONSTRAINT "ordens_compra_fornecedorId_fkey" FOREIGN KEY ("fornecedorId") REFERENCES "public"."fornecedores"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ordens_compra" ADD CONSTRAINT "ordens_compra_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "public"."usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ordens_compra" ADD CONSTRAINT "ordens_compra_restauranteId_fkey" FOREIGN KEY ("restauranteId") REFERENCES "public"."restaurantes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."itens_ordem_compra" ADD CONSTRAINT "itens_ordem_compra_ordemCompraId_fkey" FOREIGN KEY ("ordemCompraId") REFERENCES "public"."ordens_compra"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."itens_ordem_compra" ADD CONSTRAINT "itens_ordem_compra_produtoId_fkey" FOREIGN KEY ("produtoId") REFERENCES "public"."produtos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."itens_ordem_compra" ADD CONSTRAINT "itens_ordem_compra_unidadeMedidaId_fkey" FOREIGN KEY ("unidadeMedidaId") REFERENCES "public"."unidades_medida"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."entregas" ADD CONSTRAINT "entregas_comandaId_fkey" FOREIGN KEY ("comandaId") REFERENCES "public"."comandas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."entregas" ADD CONSTRAINT "entregas_restauranteId_fkey" FOREIGN KEY ("restauranteId") REFERENCES "public"."restaurantes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."entregadores" ADD CONSTRAINT "entregadores_restauranteId_fkey" FOREIGN KEY ("restauranteId") REFERENCES "public"."restaurantes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."logs_auditoria" ADD CONSTRAINT "logs_auditoria_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "public"."usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."logs_auditoria" ADD CONSTRAINT "logs_auditoria_restauranteId_fkey" FOREIGN KEY ("restauranteId") REFERENCES "public"."restaurantes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."turnos_fechamento" ADD CONSTRAINT "turnos_fechamento_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "public"."usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."turnos_fechamento" ADD CONSTRAINT "turnos_fechamento_restauranteId_fkey" FOREIGN KEY ("restauranteId") REFERENCES "public"."restaurantes"("id") ON DELETE CASCADE ON UPDATE CASCADE;
