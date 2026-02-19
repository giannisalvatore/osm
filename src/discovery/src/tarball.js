/**
 * Builds an in-memory .tgz from an array of { name, content } file objects.
 *
 * The resulting tarball has the same flat structure that the OSM CLI produces
 * (files at the root, no subdirectory prefix), so the backend and CLI tooling
 * can unpack it without modification.
 */

import { createGzip } from 'zlib';
import tarStream      from 'tar-stream';

/**
 * @param {Array<{ name: string, content: Buffer }>} files
 * @returns {Promise<Buffer>} gzipped tarball
 */
export function buildTarball(files) {
  return new Promise((resolve, reject) => {
    const pack   = tarStream.pack();
    const gzip   = createGzip();
    const chunks = [];

    gzip.on('data',  chunk => chunks.push(chunk));
    gzip.on('end',   ()    => resolve(Buffer.concat(chunks)));
    gzip.on('error', reject);

    pack.pipe(gzip);

    // Write entries sequentially, then finalise
    (async () => {
      for (const file of files) {
        await new Promise((res, rej) => {
          pack.entry({ name: file.name, size: file.content.length }, file.content, err =>
            err ? rej(err) : res()
          );
        });
      }
      pack.finalize();
    })().catch(err => {
      reject(err);
      try { pack.finalize(); } catch (_) { /* ignore */ }
    });
  });
}
