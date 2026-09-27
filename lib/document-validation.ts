/**
 * Validação de documentos brasileiros (CPF e CNPJ)
 * com algoritmo correto de dígitos verificadores
 */

export function validateCPF(cpf: string): boolean {
  const clean = cpf.replace(/\D/g, '');

  // Validar comprimento
  if (clean.length !== 11) return false;

  // Validar sequências iguais (000.000.000-00, etc)
  if (/^(\d)\1{10}$/.test(clean)) return false;

  // Calcular primeiro dígito verificador
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(clean[i]) * (10 - i);
  }

  let remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) remainder = 0;

  if (remainder !== parseInt(clean[9])) return false;

  // Calcular segundo dígito verificador
  sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += parseInt(clean[i]) * (11 - i);
  }

  remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) remainder = 0;

  if (remainder !== parseInt(clean[10])) return false;

  return true;
}

export function validateCNPJ(cnpj: string): boolean {
  const clean = cnpj.replace(/\D/g, '');

  // Validar comprimento
  if (clean.length !== 14) return false;

  // Validar sequências iguais (00.000.000/0000-00, etc)
  if (/^(\d)\1{13}$/.test(clean)) return false;

  // Calcular primeiro dígito verificador
  const multipliers1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  let sum = 0;

  for (let i = 0; i < 12; i++) {
    sum += parseInt(clean[i]) * multipliers1[i];
  }

  let remainder = sum % 11;
  remainder = remainder < 2 ? 0 : 11 - remainder;

  if (remainder !== parseInt(clean[12])) return false;

  // Calcular segundo dígito verificador
  const multipliers2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  sum = 0;

  for (let i = 0; i < 13; i++) {
    sum += parseInt(clean[i]) * multipliers2[i];
  }

  remainder = sum % 11;
  remainder = remainder < 2 ? 0 : 11 - remainder;

  if (remainder !== parseInt(clean[13])) return false;

  return true;
}

export function validateDocument(doc: string): boolean {
  const clean = doc.replace(/\D/g, '');

  if (clean.length === 11) {
    return validateCPF(doc);
  } else if (clean.length === 14) {
    return validateCNPJ(doc);
  }

  return false;
}

export function getDocumentType(doc: string): 'CPF' | 'CNPJ' | 'INVALID' {
  const clean = doc.replace(/\D/g, '');

  if (clean.length === 11) {
    return validateCPF(doc) ? 'CPF' : 'INVALID';
  } else if (clean.length === 14) {
    return validateCNPJ(doc) ? 'CNPJ' : 'INVALID';
  }

  return 'INVALID';
}
