import path from 'path'

export const MAX_PDF_BYTES = 20 * 1024 * 1024
export const libraryFilesDir = path.resolve(
  process.env.LIBRARY_FILES_DIR ||
    (process.env.MEDIA_DIR &&
    !path.resolve(process.env.MEDIA_DIR).startsWith(path.resolve('./public'))
      ? path.join(process.env.MEDIA_DIR, 'library-private')
      : './private/library-files'),
)

// Fail closed if deployment accidentally puts protected documents in Next's public tree.
const publicDir = path.resolve('./public')
if (libraryFilesDir === publicDir || libraryFilesDir.startsWith(`${publicDir}${path.sep}`)) {
  throw new Error('LIBRARY_FILES_DIR must be outside the public directory.')
}
