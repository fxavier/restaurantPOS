import { prisma } from './prisma';
import bcrypt from 'bcryptjs';

export async function seedAuthData() {
  try {
    // Check if any users exist
    const existingUsers = await prisma.usuario.count();
    if (existingUsers > 0) {
      console.log('Users already exist, skipping auth seeding');
      return;
    }

    // Create a default restaurant if none exists
    let restaurant = await prisma.restaurante.findFirst();
    if (!restaurant) {
      restaurant = await prisma.restaurante.create({
        data: {
          nome: 'Restaurante Demo',
          endereco: 'Rua Principal, 123',
          telefone: '+258 84 123 4567',
          email: 'admin@restaurante.com',
          nuit: '123456789',
          taxaServico: 0.1, // 10%
        },
      });
      console.log('Created default restaurant:', restaurant.nome);
    }

    // Create default admin user
    const hashedPassword = await bcrypt.hash('admin123', 12);
    const adminUser = await prisma.usuario.create({
      data: {
        nome: 'Administrador',
        email: 'admin@restaurante.com',
        username: 'admin',
        senha: hashedPassword,
        telefone: '+258 84 123 4567',
        perfil: 'admin',
        permissoes: ['all'],
        ativo: true,
        restauranteId: restaurant.id,
      },
    });

    console.log('Created default admin user:');
    console.log('Username: admin');
    console.log('Password: admin123');
    console.log('Email:', adminUser.email);

    // Create a sample garcom user
    const garcomPassword = await bcrypt.hash('garcom123', 12);
    const garcomUser = await prisma.usuario.create({
      data: {
        nome: 'João Garçom',
        email: 'garcom@restaurante.com',
        username: 'joao.garcom',
        senha: garcomPassword,
        telefone: '+258 84 987 6543',
        perfil: 'garcom',
        permissoes: ['pos', 'comandas'],
        ativo: true,
        restauranteId: restaurant.id,
      },
    });

    console.log('Created sample garcom user:');
    console.log('Username: joao.garcom');
    console.log('Password: garcom123');

    // Create a sample cozinha user
    const cozinhaPassword = await bcrypt.hash('cozinha123', 12);
    const cozinhaUser = await prisma.usuario.create({
      data: {
        nome: 'Maria Cozinha',
        email: 'cozinha@restaurante.com',
        username: 'maria.cozinha',
        senha: cozinhaPassword,
        telefone: '+258 84 555 1234',
        perfil: 'cozinha',
        permissoes: ['kds'],
        ativo: true,
        restauranteId: restaurant.id,
      },
    });

    console.log('Created sample cozinha user:');
    console.log('Username: maria.cozinha');
    console.log('Password: cozinha123');

    return {
      restaurant,
      users: [adminUser, garcomUser, cozinhaUser],
    };
  } catch (error) {
    console.error('Error seeding auth data:', error);
    throw error;
  }
}