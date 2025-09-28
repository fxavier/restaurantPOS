import { NextRequest, NextResponse } from 'next/server';
import { s3Service } from '@/lib/s3-service';
import { UPLOAD_CONFIGS } from '@/lib/upload-service';

export async function POST(request: NextRequest) {
	try {
		const formData = await request.formData();
		const file = formData.get('file') as File;
		const restaurantId = formData.get('restaurantId') as string;
		const productId = formData.get('productId') as string;

		if (!file) {
			return NextResponse.json(
				{ error: 'Nenhum arquivo foi enviado' },
				{ status: 400 }
			);
		}

		// Get upload configuration for product images
		const config = UPLOAD_CONFIGS.PRODUCT_IMAGES;

		// Validate file
		if (file.size > config.maxFileSize) {
			return NextResponse.json(
				{
					error: `Arquivo muito grande. Tamanho máximo: ${Math.round(
						config.maxFileSize / 1024 / 1024
					)}MB`,
				},
				{ status: 400 }
			);
		}

		if (!config.allowedTypes.some((type) => type === file.type)) {
			return NextResponse.json(
				{
					error: `Tipo de arquivo não permitido. Tipos aceitos: ${config.allowedTypes.join(
						', '
					)}`,
				},
				{ status: 400 }
			);
		}

		// Convert file to buffer
		const buffer = await file.arrayBuffer();
		const uint8Array = new Uint8Array(buffer);

		// Upload product image to S3
		const result = await s3Service.uploadFile(uint8Array, file.name, {
			folder: config.folder,
			restaurantId,
			contentType: file.type,
			metadata: {
				originalName: file.name,
				fileSize: file.size.toString(),
				uploadType: config.folder,
			},
		});

		if (!result.success) {
			return NextResponse.json({ error: result.error }, { status: 400 });
		}

		// TODO: Update product in database with new image URL
		// await prisma.produto.update({
		//   where: { id: productId },
		//   data: { imagem: result.file?.url }
		// });

		return NextResponse.json({
			success: true,
			imageUrl: result.file?.url,
			file: result.file,
		});
	} catch (error) {
		console.error('Product image upload error:', error);
		return NextResponse.json(
			{ error: 'Erro interno do servidor' },
			{ status: 500 }
		);
	}
}

export async function DELETE(request: NextRequest) {
	try {
		const { searchParams } = new URL(request.url);
		const fileKey = searchParams.get('key');
		const productId = searchParams.get('productId');

		if (!fileKey) {
			return NextResponse.json(
				{ error: 'Chave do arquivo é obrigatória' },
				{ status: 400 }
			);
		}

		// Delete from S3
		const success = await s3Service.deleteFile(fileKey);

		if (!success) {
			return NextResponse.json(
				{ error: 'Falha ao excluir o arquivo' },
				{ status: 400 }
			);
		}

		// TODO: Update product in database to remove image URL
		// if (productId) {
		//   await prisma.produto.update({
		//     where: { id: productId },
		//     data: { imagem: null }
		//   });
		// }

		return NextResponse.json({
			success: true,
			message: 'Imagem do produto excluída com sucesso',
		});
	} catch (error) {
		console.error('Product image delete error:', error);
		return NextResponse.json(
			{ error: 'Erro interno do servidor' },
			{ status: 500 }
		);
	}
}
