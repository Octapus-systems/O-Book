import { NextResponse } from 'next/server'

export async function POST() {
  return NextResponse.json(
    {
      success: false,
      message: 'Legacy PIN authentication disabled. Please use Supabase Auth.',
      error: 'LEGACY_AUTH_DISABLED',
    },
    { status: 410 }
  )
}
