import { NextRequest, NextResponse } from 'next/server';
import { s3Service } from '@/lib/s3-service';
import { UPLOAD_CONFIGS } from '@/lib/upload-service';

export async function POST(request: NextRequest) {
	try {
		const formData = await request.formData();
		const file = formData.get('file') as File;
		const uploadType = formData.get('uploadType') as string;
		const restaurantId = formData.get('restaurantId') as string;

		if (!file) {
			return NextResponse.json(
				{ error: 'Nenhum arquivo foi enviado' },
				{ status: 400 }
			);
		}

		if (!uploadType) {
			return NextResponse.json(
				{ error: 'Tipo de upload é obrigatório' },
				{ status: 400 }
			);
		}

		// Get upload configuration
		let config;
		switch (uploadType) {
			case 'product':
				config = UPLOAD_CONFIGS.PRODUCT_IMAGES;
				break;
			case 'logo':
			case 'logos':
				config = UPLOAD_CONFIGS.RESTAURANT_LOGOS;
				break;
			case 'avatar':
			case 'avatars':
				config = UPLOAD_CONFIGS.USER_AVATARS;
				break;
			case 'menu':
			case 'menus':
				config = UPLOAD_CONFIGS.MENU_IMAGES;
				break;
			case 'document':
			case 'documents':
				config = UPLOAD_CONFIGS.DOCUMENTS;
				break;
			default:
				return NextResponse.json(
					{ error: 'Tipo de upload não suportado' },
					{ status: 400 }
				);
		}

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

		// Upload to S3
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

		return NextResponse.json({
			success: true,
			file: result.file,
		});
	} catch (error) {
		console.error('Upload API error:', error);
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

		if (!fileKey) {
			return NextResponse.json(
				{ error: 'Chave do arquivo é obrigatória' },
				{ status: 400 }
			);
		}

		const success = await s3Service.deleteFile(fileKey);

		if (!success) {
			return NextResponse.json(
				{ error: 'Falha ao excluir o arquivo' },
				{ status: 400 }
			);
		}

		return NextResponse.json({
			success: true,
			message: 'Arquivo excluído com sucesso',
		});
	} catch (error) {
		console.error('Delete API error:', error);
		return NextResponse.json(
			{ error: 'Erro interno do servidor' },
			{ status: 500 }
		);
	}
}
