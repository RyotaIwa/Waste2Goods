import path from 'node:path';
import { fileURLToPath } from 'node:url';
import express from 'express';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const CDN_ROOT = path.resolve(__dirname, '../../public/cdn');

export const CDN_HEADERS = {
  'Cache-Control': 'public, max-age=31536000, immutable',
  'CDN-Cache-Control': 'max-age=31536000',
  'Surrogate-Control': 'max-age=31536000',
  'Surrogate-Key': 'static-assets w2g-cdn',
};

export function attachCdnStatic(app) {
  app.use('/cdn', (req, res, next) => {
    Object.entries(CDN_HEADERS).forEach(([k, v]) => res.setHeader(k, v));
    next();
  }, express.static(CDN_ROOT, { maxAge: '365d', immutable: true, index: ['index.html'] }));
}

export function cdnInfo() {
  return {
    localEdge: 'GET /cdn/* served by this API with long-lived Cache-Control + Surrogate-Key (Cloudflare/CloudFront compatible)',
    production: {
      cloudflare: 'Put this origin behind Cloudflare; cache rule: URI path starts with /cdn → Edge TTL 1 year, respect existing headers',
      cloudfront: 'Behavior /cdn* → CachingOptimized, Compress, Origin = this API or S3/static bucket',
    },
    headers: CDN_HEADERS,
    sampleAssets: ['/cdn/index.html', '/cdn/brand.css', '/cdn/logo.svg'],
  };
}

export default { attachCdnStatic, cdnInfo, CDN_HEADERS, CDN_ROOT };
