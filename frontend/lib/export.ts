import api from './api';

type ExportFormat = 'xlsx' | 'pdf';

function parseFilenameFromContentDisposition(header?: string): string | null {
  if (!header) return null;
  // Examples:
  // attachment; filename="students.xlsx"
  // attachment; filename=students.xlsx
  const match = header.match(/filename\*?=(?:UTF-8''|\"?)([^\";]+)\"?/i);
  if (!match?.[1]) return null;
  try {
    return decodeURIComponent(match[1]);
  } catch {
    return match[1];
  }
}

export async function downloadExport(entity: string, format: ExportFormat) {
  const response = await api.get<Blob>(`/exports/${entity}`, {
    params: { format },
    responseType: 'blob',
  });

  const filename =
    parseFilenameFromContentDisposition(response.headers?.['content-disposition']) ||
    `${entity}.${format}`;

  const blob = response.data as unknown as Blob;
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.URL.revokeObjectURL(url);
}









