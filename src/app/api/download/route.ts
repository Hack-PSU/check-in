import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
	try {
		const searchParams = request.nextUrl.searchParams;
		const url = searchParams.get('url');

		if (!url) {
			return NextResponse.json(
				{ error: 'URL parameter is required' },
				{ status: 400 }
			);
		}

		// Validate that the URL is from the allowed CDN
		const cdnUrl = new URL(url);
		if (cdnUrl.hostname !== 'cdn.hackpsu.org') {
			return NextResponse.json(
				{ error: 'Invalid URL - must be from cdn.hackpsu.org' },
				{ status: 400 }
			);
		}

		// Fetch the file from the CDN
		const response = await fetch(url);

		if (!response.ok) {
			return NextResponse.json(
				{ error: 'Failed to fetch file from CDN' },
				{ status: response.status }
			);
		}

		// Get the file data
		const blob = await response.blob();
		const buffer = Buffer.from(await blob.arrayBuffer());

		// Extract filename from URL
		const filename = url.split('/').pop() || 'download';

		// Return the file with proper headers
		return new NextResponse(buffer, {
			headers: {
				'Content-Type': response.headers.get('Content-Type') || 'application/octet-stream',
				'Content-Disposition': `attachment; filename="${filename}"`,
				'Content-Length': buffer.length.toString(),
			},
		});
	} catch (error) {
		console.error('Download proxy error:', error);
		return NextResponse.json(
			{ error: 'Internal server error' },
			{ status: 500 }
		);
	}
}
