import { NextRequest, NextResponse } from 'next/server';
import zlib from "zlib";
import { uploadFileToS3 } from '@/app/lib/services/s3Service';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const { sessionId, htmlContent } = body;

    // Validate required fields
    if (!sessionId || !htmlContent) {
      return NextResponse.json(
        { error: 'sessionId and htmlContent are required' },
        { status: 400 }
      );
    }

    // Validate sessionId format (should be a UUID)
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(sessionId)) {
      return NextResponse.json(
        { error: 'Invalid sessionId format' },
        { status: 400 }
      );
    }

    // Create filename: <session_id>.html
    const filename = `${sessionId}.html`;
    
    // Upload HTML to S3
    
    try {
         const compressedPreviewHtml = zlib.gzipSync(htmlContent);

      await uploadFileToS3(
        filename,
        compressedPreviewHtml,
        "text/html", "gzip"
      );

      // Construct the public URL
      const bucket = process.env.S3_BUCKET;
      if (!bucket) {
        throw new Error('S3_BUCKET environment variable is not set');
      }

      const publicUrl = `https://${bucket}/${filename}`;

      return NextResponse.json(
        { 
          success: true, 
          message: 'Presentation uploaded successfully',
          url: publicUrl,
          filename: filename
        },
        { status: 200 }
      );

    } catch (s3Error) {
      console.error('Error uploading to S3:', s3Error);
      return NextResponse.json(
        { 
          success: false,
          error: 'Failed to upload to S3',
          message: s3Error instanceof Error ? s3Error.message : 'Unknown S3 error'
        },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('Error processing share request:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  return NextResponse.json(
    { message: 'Share presentation API is working' },
    { status: 200 }
  );
}