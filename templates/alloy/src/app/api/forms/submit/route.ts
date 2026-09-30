import { NextRequest, NextResponse } from 'next/server';

type FormSubmitBody = {
  targetUrl: string;
  payload: Record<string, unknown>;
  formKey: string;
};

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as FormSubmitBody;

    if (!body.targetUrl) {
      return NextResponse.json({ error: 'Missing targetUrl' }, { status: 400 });
    }

    const response = await fetch(body.targetUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body.payload),
    });

    return new NextResponse(null, { status: response.ok ? 200 : 502 });
  } catch (error) {
    console.error('Form proxy error:', error);
    return NextResponse.json(
      { error: 'Failed to forward form submission' },
      { status: 502 },
    );
  }
}
