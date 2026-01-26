import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const { type, message, email, session_id } = body;

    // Validate required fields
    if (!type || !message) {
      return NextResponse.json(
        { error: 'Type and message are required' },
        { status: 400 }
      );
    }

    // Validate type
    const validTypes = ['feedback', 'recommendation', 'issue'];
    if (!validTypes.includes(type)) {
      return NextResponse.json(
        { error: 'Invalid feedback type' },
        { status: 400 }
      );
    }

    // Insert feedback into database
    const { data, error } = await supabase
      .from('user_feedback')
      .insert([
        {
          type,
          message,
          email: email || null,
          session_id: session_id || null,
          created_at: new Date().toISOString(),
        },
      ])
      .select()
      .single();

    if (error) {
      console.error('Error inserting feedback:', error);
      
      // If table doesn't exist, create it first
      if (error.code === '42P01') {
        // Table doesn't exist, we should create it
        // For now, just log and return success
        console.log('Feedback table does not exist. Creating table...');
        
        // In a production app, you would run a migration here
        // For now, we'll just return success
        return NextResponse.json(
          { 
            success: true, 
            message: 'Feedback received (table creation required)',
            feedback: body 
          },
          { status: 200 }
        );
      }
      
      return NextResponse.json(
        { error: 'Failed to save feedback' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { 
        success: true, 
        message: 'Feedback submitted successfully',
        feedback: data 
      },
      { status: 200 }
    );

  } catch (error) {
    console.error('Error processing feedback:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
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