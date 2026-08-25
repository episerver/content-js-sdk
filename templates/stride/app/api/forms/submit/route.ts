import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const data = Object.fromEntries(formData);
    console.log('Form submission from CMS:', data);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error processing form submission:', error);

    return NextResponse.json(
      { error: 'Failed to process form submission' },
      { status: 500 },
    );
  }
}
