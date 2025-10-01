import { nanoid } from 'nanoid';
import { NextRequest, NextResponse } from 'next/server';

export default async function middleware(request: NextRequest) {
  const userId = request.cookies.get('user_id');

  if (userId) {
    // console.log('User has an ID', userId);
    return NextResponse.next();
  } else {
    const newUserId = nanoid();
    // console.log("User doesn't have an ID. Creating new one:", newUserId);
    request.cookies.set('user_id', newUserId);

    const response = NextResponse.next();
    response.cookies.set('user_id', newUserId);
    return response;
  }
}
