import { mkdir, copyFile, readdir } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const target = resolve(root, 'public/ocr')
await mkdir(target, { recursive: true })
await copyFile(resolve(root, 'node_modules/tesseract.js/dist/worker.min.js'), resolve(target, 'worker.min.js'))
await copyFile(resolve(root, 'node_modules/tesseract.js/LICENSE.md'), resolve(target, 'LICENSE-tesseract.txt'))
await copyFile(resolve(root, 'node_modules/tesseract.js-core/LICENSE'), resolve(target, 'LICENSE-core.txt'))
for (const file of await readdir(resolve(root, 'node_modules/tesseract.js-core'))) {
  if (/^tesseract-core.*\.wasm(?:\.js)?$/.test(file)) await copyFile(resolve(root, 'node_modules/tesseract.js-core', file), resolve(target, file))
}
for (const language of ['eng', 'chi_sim']) {
  await copyFile(resolve(root, `node_modules/@tesseract.js-data/${language}/4.0.0_best_int/${language}.traineddata.gz`), resolve(target, `${language}.traineddata.gz`))
}
console.log('已准备本机 OCR 资源。')
