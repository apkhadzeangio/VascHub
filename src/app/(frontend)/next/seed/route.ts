export function POST() {
  return Response.json({ error: 'Demo seeding is disabled in VascHub.' }, { status: 403 })
}
