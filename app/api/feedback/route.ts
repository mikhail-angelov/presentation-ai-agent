import { NextRequest, NextResponse } from 'next/server';
import { feedbackService } from '@/app/lib/services/feedback';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const { type, message, email, session_id } = body;

    // Submit feedback using the service
    const result = await feedbackService.submitFeedback({
      type,
      message,
      email,
      session_id,
    });

    // Return appropriate response based on service result
    if (result.success) {
      return NextResponse.json(
        { 
          success: true, 
          message: result.message,
          feedback: result.feedback 
        },
        { status: 200 }
      );
    } else {
      // Determine appropriate status code
      const statusCode = result.error?.includes('required') || result.error?.includes('Invalid') 
        ? 400 
        : 500;
      
      return NextResponse.json(
        { 
          success: false,
          error: result.error || 'Failed to save feedback',
          message: result.message 
        },
        { status: statusCode }
      );
    }

  } catch (error) {
    console.error('Error processing feedback:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Internal server error',
        message: 'Failed to process feedback' 
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  return NextResponse.json(
    { message: 'Feedback API is working' },
    { status: 200 }
  );
}
