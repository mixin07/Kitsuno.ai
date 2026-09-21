// Loads /logo1.png (a JPEG: orange card + black/white fox character) and
// renders it as a WHITE fox on TRANSPARENT — the same border flood-fill
// surface-keying used for the fox cut-outs, then a white tint. Produces a
// crisp single-tone logo mark with no baked orange card.

let cached = null

function isOrangeSurface(r, g, b) {
  // background card measures ~rgb(204,104,42); tolerate baked JPEG noise.
  return Math.abs(r - 204) + Math.abs(g - 104) + Math.abs(b - 42) <= 90
}

export function whiteLogoSrc() {
  if (cached) return cached
  cached = new Promise((resolve, reject) => {
    const img = new Image()
    img.decoding = 'async'
    img.onload = () => {
      try {
        const width = img.naturalWidth
        const height = img.naturalHeight
        const canvas = document.createElement('canvas')
        canvas.width = width
        canvas.height = height
        const ctx = canvas.getContext('2d', { willReadFrequently: true })
        ctx.drawImage(img, 0, 0)
        const image = ctx.getImageData(0, 0, width, height)
        const data = image.data
        const visited = new Uint8Array(width * height)
        const queue = new Int32Array(width * height)
        let head = 0
        let tail = 0

        const push = (p) => {
          if (visited[p]) return
          visited[p] = 1
          queue[tail++] = p
        }
        const match = (p) => {
          const i = p * 4
          return isOrangeSurface(data[i], data[i + 1], data[i + 2])
        }

        for (let x = 0; x < width; x++) {
          const top = x
          const bottom = (height - 1) * width + x
          if (match(top)) push(top)
          if (match(bottom)) push(bottom)
        }
        for (let y = 0; y < height; y++) {
          const left = y * width
          const right = y * width + (width - 1)
          if (match(left)) push(left)
          if (match(right)) push(right)
        }

        while (head < tail) {
          const p = queue[head++]
          const x = p % width
          const y = (p / width) | 0
          if (x > 0) {
            const q = p - 1
            if (!visited[q] && match(q)) push(q)
          }
          if (x < width - 1) {
            const q = p + 1
            if (!visited[q] && match(q)) push(q)
          }
          if (y > 0) {
            const q = p - width
            if (!visited[q] && match(q)) push(q)
          }
          if (y < height - 1) {
            const q = p + width
            if (!visited[q] && match(q)) push(q)
          }
        }

        for (let p = 0; p < width * height; p++) {
          if (visited[p]) {
            data[p * 4 + 3] = 0
            continue
          }
          data[p * 4] = 255
          data[p * 4 + 1] = 255
          data[p * 4 + 2] = 255
        }

        ctx.putImageData(image, 0, 0)

        let minX = width
        let minY = height
        let maxX = -1
        let maxY = -1
        for (let p = 0; p < width * height; p++) {
          const i = p * 4
          if (data[i + 3] === 0) continue
          const x = p % width
          const y = (p / width) | 0
          if (x < minX) minX = x
          if (x > maxX) maxX = x
          if (y < minY) minY = y
          if (y > maxY) maxY = y
        }

        if (maxX < minX || maxY < minY) {
          resolve(canvas.toDataURL('image/png'))
          return
        }

        const cropWidth = maxX - minX + 1
        const cropHeight = maxY - minY + 1
        const sq = Math.max(cropWidth, cropHeight)
        const pad = Math.round(sq * 0.04)
        const out = document.createElement('canvas')
        out.width = sq + pad * 2
        out.height = sq + pad * 2
        out
          .getContext('2d')
          .drawImage(canvas, minX, minY, cropWidth, cropHeight, pad, pad, cropWidth, cropHeight)
        resolve(out.toDataURL('image/png'))
      } catch (err) {
        reject(err)
      }
    }
    img.onerror = reject
    img.src = '/logo1.png'
  })
  return cached
}