import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const data = Object.fromEntries(formData);
    console.log('Form submission from CMS:', data);

    const referer = request.headers.get('referer') || '/';
    const redirectUrl = new URL('?formState=success', referer);
    redirectUrl.hash = 'form-alert';
    return NextResponse.redirect(redirectUrl, { status: 303 });
  } catch (error) {
    console.error('Error processing form submission:', error);
    const redirectUrl = new URL('?formState=fail', request.headers.get('referer') || '/');
    redirectUrl.hash = 'form-alert';
    return NextResponse.redirect(redirectUrl, { status: 303 });
  }
}
