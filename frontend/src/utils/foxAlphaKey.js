function isBankedWhite(r, g, b) {
  return (
    r >= 238 &&
    g >= 238 &&
    b >= 238 &&
    Math.abs(r - g) <= 28 &&
    Math.abs(g - b) <= 28 &&
    Math.abs(r - b) <= 28
  )
}

/**
 * True-alpha cut-out, run in place on a canvas: flood-fills the contiguous
 * background surface that touches the canvas borders and drops those pixels
 * to alpha 0. Only the true near-white background is keyed here: the source
 * fox has light-gray cap, fur, and pants pixels that must remain opaque.
 * Genuine transparency is used instead of blend / opacity tricks.
 */
function isBankedSurface(r, g, b) {
  return isBankedWhite(r, g, b)
}

export function keySurfaceWhite(ctx, width, height) {
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

  for (let x = 0; x < width; x++) {
    if (isBankedSurface(data[x * 4], data[x * 4 + 1], data[x * 4 + 2])) push(x)
    const bottom = (height - 1) * width + x
    if (isBankedSurface(data[bottom * 4], data[bottom * 4 + 1], data[bottom * 4 + 2])) push(bottom)
  }
  for (let y = 0; y < height; y++) {
    const left = y * width
    if (isBankedSurface(data[left * 4], data[left * 4 + 1], data[left * 4 + 2])) push(left)
    const right = y * width + (width - 1)
    if (isBankedSurface(data[right * 4], data[right * 4 + 1], data[right * 4 + 2])) push(right)
  }

  while (head < tail) {
    const p = queue[head++]
    const x = p % width
    const y = (p / width) | 0
    if (x > 0) {
      const q = p - 1
      if (!visited[q] && isBankedSurface(data[q * 4], data[q * 4 + 1], data[q * 4 + 2])) push(q)
    }
    if (x < width - 1) {
      const q = p + 1
      if (!visited[q] && isBankedSurface(data[q * 4], data[q * 4 + 1], data[q * 4 + 2])) push(q)
    }
    if (y > 0) {
      const q = p - width
      if (!visited[q] && isBankedSurface(data[q * 4], data[q * 4 + 1], data[q * 4 + 2])) push(q)
    }
    if (y < height - 1) {
      const q = p + width
      if (!visited[q] && isBankedSurface(data[q * 4], data[q * 4 + 1], data[q * 4 + 2])) push(q)
    }
  }

  for (let p = 0; p < width * height; p++) {
    if (visited[p]) data[p * 4 + 3] = 0
  }

  ctx.putImageData(image, 0, 0)
}

export function removeFoxGroundArtifact(ctx, width, height) {
  const image = ctx.getImageData(0, 0, width, height)
  const data = image.data
  const visited = new Uint8Array(width * height)
  const queue = new Int32Array(width * height)

  const isGroundPixel = (p) => {
    const i = p * 4
    const max = Math.max(data[i], data[i + 1], data[i + 2])
    const min = Math.min(data[i], data[i + 1], data[i + 2])
    return max >= 120 && max - min <= 38
  }

  for (let y = Math.floor(height * 0.72); y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const start = y * width + x
      if (visited[start] || !isGroundPixel(start)) continue

      let head = 0
      let tail = 0
      let minX = x
      let maxX = x
      let minY = y
      let maxY = y
      queue[tail++] = start
      visited[start] = 1

      while (head < tail) {
        const p = queue[head++]
        const px = p % width
        const py = (p / width) | 0
        minX = Math.min(minX, px)
        maxX = Math.max(maxX, px)
        minY = Math.min(minY, py)
        maxY = Math.max(maxY, py)
        const neighbors = [p - 1, p + 1, p - width, p + width]
        for (const next of neighbors) {
          const nx = next % width
          if (next < 0 || next >= width * height || Math.abs(nx - px) > 1) continue
          if (!visited[next] && isGroundPixel(next)) {
            visited[next] = 1
            queue[tail++] = next
          }
        }
      }

      const componentWidth = maxX - minX + 1
      const componentHeight = maxY - minY + 1
      if (
        minY >= height * 0.78 &&
        componentWidth >= width * 0.2 &&
        componentWidth > componentHeight * 1.35
      ) {
        for (let i = 0; i < tail; i += 1) data[queue[i] * 4 + 3] = 0
      }
    }
  }

  for (let y = Math.floor(height * 0.88); y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const start = y * width + x
      if (data[start * 4 + 3] === 0) continue
      let runEnd = x
      while (runEnd < width) {
        const i = (y * width + runEnd) * 4
        const neutral =
          data[i + 3] > 10 &&
          data[i] > 205 &&
          data[i + 1] > 205 &&
          data[i + 2] > 205 &&
          Math.max(data[i], data[i + 1], data[i + 2]) -
            Math.min(data[i], data[i + 1], data[i + 2]) <= 34
        if (!neutral) break
        runEnd += 1
      }
      if (runEnd - x >= width * 0.28) {
        for (let runX = x; runX < runEnd; runX += 1) {
          data[(y * width + runX) * 4 + 3] = 0
        }
      }
      x = runEnd
    }
  }

  ctx.putImageData(image, 0, 0)
}

export function cleanFoxEdgeFringe(ctx, width, height) {
  const image = ctx.getImageData(0, 0, width, height)
  const data = image.data

  const isMutedLightPixel = (r, g, b) => {
    const max = Math.max(r, g, b)
    const min = Math.min(r, g, b)
    return max > 220 && max - min < 30
  }

  for (let pass = 0; pass < 2; pass += 1) {
    for (let y = 0; y < height; y += 1) {
      for (let x = 0; x < width; x += 1) {
        const idx = (y * width + x) * 4
        if (data[idx + 3] === 0) continue

        const r = data[idx]
        const g = data[idx + 1]
        const b = data[idx + 2]
        const paleWarmFringe = r > 190 && g > 135 && b > 105 && r - g < 105 && g - b < 75
        if (!isMutedLightPixel(r, g, b) && !paleWarmFringe) continue

        let nearTransparent = 0
        let opaqueNeighbors = 0
        for (let yy = Math.max(0, y - 1); yy <= Math.min(height - 1, y + 1); yy += 1) {
          for (let xx = Math.max(0, x - 1); xx <= Math.min(width - 1, x + 1); xx += 1) {
            if (xx === x && yy === y) continue
            const nIdx = (yy * width + xx) * 4 + 3
            if (data[nIdx] === 0) nearTransparent += 1
            else opaqueNeighbors += 1
          }
        }

        if (nearTransparent >= 2 && opaqueNeighbors <= 5) {
          data[idx + 3] = 0
        }
      }
    }
  }

  ctx.putImageData(image, 0, 0)
}