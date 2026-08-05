import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const data = Object.fromEntries(formData);
    console.log('Form submission from CMS:', data);

    const referer = request.headers.get('referer') || '/';
    return NextResponse.redirect(new URL('?formState=success', referer), { status: 303 });
  } catch (error) {
    console.error('Error processing form submission:', error);
    return NextResponse.redirect(new URL('?formState=fail', request.headers.get('referer') || '/'), { status: 303 });
  }
}
