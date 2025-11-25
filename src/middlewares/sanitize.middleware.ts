import { Request, Response, NextFunction } from 'express';
import xss from 'xss';

function sanitizeValue(value: any): any {
  if (typeof value === 'string') {
    // Sanitize strings to remove potentially malicious scripts
    return xss(value);
  }
  if (Array.isArray(value)) {
    return value.map(sanitizeValue);
  }
  if (value && typeof value === 'object') {
    return sanitizeObject(value);
  }
  return value;
}

function sanitizeObject(obj: any) {
  if (!obj || typeof obj !== 'object') return obj;
  for (const key of Object.keys(obj)) {
    try {
      obj[key] = sanitizeValue(obj[key]);
    } catch (e) {
    }
  }
  return obj;
}

export function sanitizeMiddleware(req: Request, _res: Response, next: NextFunction) {
  if (req.body) sanitizeObject(req.body);
  if (req.query) sanitizeObject(req.query);
  if (req.params) sanitizeObject(req.params);
  next();
}
