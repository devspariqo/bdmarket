import { NextResponse } from 'next/server';
import prisma from '@/lib/db';

export async function POST(req: Request) {
  const ct = req.headers.get('content-type') || '';
  const isJson = ct.includes('application/json');

  try {
    let email = '';
    if (isJson) {
      email = (await req.json()).email || '';
    } else {
      const form = await req.formData();
      email = String(form.get('email') || '');
    }

    // JSON callers (fetch from React) get a JSON response so they can show inline
    // feedback; classic form posts get a redirect back to the homepage.
    if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
      return isJson
        ? NextResponse.json({ ok: false, error: 'Please enter a valid email address.' }, { status: 400 })
        : NextResponse.redirect(new URL('/?subscribed=invalid', req.url));
    }

    await prisma.newsletter.upsert({
      where: { email: email.toLowerCase() },
      update: { status: 'subscribed' },
      create: { email: email.toLowerCase() },
    });

    return isJson
      ? NextResponse.json({ ok: true, message: 'Thanks! You are subscribed.' })
      : NextResponse.redirect(new URL('/?subscribed=1', req.url));
  } catch {
    return isJson
      ? NextResponse.json({ ok: false, error: 'Something went wrong. Please try again.' }, { status: 500 })
      : NextResponse.redirect(new URL('/?subscribed=error', req.url));
  }
}

