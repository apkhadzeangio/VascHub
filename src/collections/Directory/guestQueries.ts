import { APIError, type CollectionBeforeOperationHook, type Where } from 'payload'
const centreField = (v: string) => v === 'centres' || v.startsWith('centres.')
const invalidQuery = () =>
  new APIError('Public centre filters support published centre IDs with equals/in only.', 400)
const record = (v: unknown): v is Record<string, unknown> =>
  !!v && typeof v === 'object' && !Array.isArray(v)
// Related WHERE joins do not inherit the related collection's read access.
export const guardGuestCentreQueries: CollectionBeforeOperationHook<'specialists'> = async ({
  args,
  req,
  overrideAccess,
  operation,
}) => {
  if (req.user || overrideAccess || !['read', 'readDistinct', 'count'].includes(operation))
    return args
  if ('field' in args && typeof args.field === 'string' && centreField(args.field))
    throw invalidQuery()
  if ('sort' in args) {
    const fields = typeof args.sort === 'string' ? args.sort.split(',') : args.sort || []
    if (fields.some((f) => centreField(f.replace(/^-/, '')))) throw invalidQuery()
  }
  if (!('where' in args) || !args.where) return args
  const requested = new Set<number>()
  const ids = (v: unknown) => {
    const values = Array.isArray(v)
      ? v
      : typeof v === 'string' && v.includes(',')
        ? v.split(',')
        : [v]
    return values.map((v) => {
      if ((typeof v !== 'string' && typeof v !== 'number') || !/^-?\d+$/.test(String(v)))
        throw invalidQuery()
      const id = Number(v)
      if (!Number.isSafeInteger(id) || id > 2147483647 || id < -2147483648) throw invalidQuery()
      requested.add(id)
      return id
    })
  }
  const inspect = (node: unknown): void => {
    if (Array.isArray(node)) return node.forEach(inspect)
    if (!record(node)) return
    for (const [key, value] of Object.entries(node)) {
      if (key.startsWith('centres.')) throw invalidQuery()
      if (key === 'centres') {
        if (
          !record(value) ||
          !Object.keys(value).length ||
          Object.keys(value).some((op) => !['equals', 'in'].includes(op))
        )
          throw invalidQuery()
        for (const [op, v] of Object.entries(value))
          if (ids(v).length !== 1 && op === 'equals') throw invalidQuery()
      } else if (key === 'and' || key === 'or') inspect(value)
    }
  }
  inspect(args.where)
  if (!requested.size) return args
  const r = await req.payload.find({
    collection: 'centres',
    overrideAccess: false,
    user: null,
    req,
    draft: false,
    depth: 0,
    pagination: false,
    where: { and: [{ _status: { equals: 'published' } }, { id: { in: [...requested] } }] },
    select: { name: true },
  })
  const available = new Set(r.docs.map((c) => c.id))
  const rewrite = (node: unknown): unknown => {
    if (Array.isArray(node)) return node.map(rewrite)
    if (!record(node)) return node
    return Object.fromEntries(
      Object.entries(node).map(([k, v]) => {
        if (k === 'centres' && record(v))
          return [
            k,
            Object.fromEntries(
              Object.entries(v).map(([op, value]) => {
                const publicIDs = ids(value).filter((id) => available.has(id))
                return [
                  op,
                  op === 'equals' ? (publicIDs[0] ?? -1) : publicIDs.length ? publicIDs : [-1],
                ]
              }),
            ),
          ]
        return [k, k === 'and' || k === 'or' ? rewrite(v) : v]
      }),
    )
  }
  args.where = rewrite(args.where) as Where
  return args
}
