import chardet from 'chardet';
import iconv from 'iconv-lite';
export function toUtf8(buffer: Buffer): string {
  const enc = chardet.detect(buffer) || 'UTF-8';
  return iconv.decode(buffer, enc);
}
