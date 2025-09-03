/**
 * Utilidad para extraer componentes reutilizables de archivos grandes
 * Esta herramienta analiza archivos React y detecta patrones que pueden convertirse en componentes independientes
 */

import fs from 'fs';
import path from 'path';
import { parse } from '@babel/parser';
import traverse from '@babel/traverse';
import generate from '@babel/generator';
import * as t from '@babel/types';

/**
 * Opciones para la extracción de componentes
 */
interface ExtractComponentOptions {
  /**
   * Ruta al archivo fuente
   */
  sourcePath: string;

  /**
   * Directorio de salida para los componentes extraídos
   */
  outputDir: string;

  /**
   * Umbral mínimo de líneas para considerar extraer un componente
   */
  minLines?: number;

  /**
   * Modo de extracción (automático o manual)
   */
  mode?: 'auto' | 'manual';

  /**
   * Nombres de componentes a extraer (modo manual)
   */
  componentNames?: string[];
}

/**
 * Extrae componentes de un archivo React
 */
export async function extractComponents(
  options: ExtractComponentOptions
): Promise<string[]> {
  const {
    sourcePath,
    outputDir,
    minLines = 50,
    mode = 'auto',
    componentNames = [],
  } = options;

  // Leer el archivo fuente
  const sourceCode = fs.readFileSync(sourcePath, 'utf-8');

  // Parsear el código con Babel
  const ast = parse(sourceCode, {
    sourceType: 'module',
    plugins: ['jsx', 'typescript'],
  });

  const extractedComponents: string[] = [];

  // Recorrer el AST para encontrar componentes
  traverse(ast, {
    FunctionDeclaration(path: any) {
      if (shouldExtractComponent(path.node, minLines, mode, componentNames)) {
        const componentName = path.node.id?.name || '';
        const componentCode = generate(path.node).code;

        // Crear el archivo del componente
        const componentFilePath = getComponentFilePath(
          outputDir,
          componentName
        );
        createComponentFile(componentFilePath, componentCode, sourceCode);

        extractedComponents.push(componentName);
      }
    },

    VariableDeclaration(path: any) {
      // Buscar declaraciones de variables que sean componentes funcionales
      path.node.declarations.forEach((declaration: any) => {
        if (
          t.isVariableDeclarator(declaration) &&
          t.isIdentifier(declaration.id) &&
          declaration.init &&
          (t.isArrowFunctionExpression(declaration.init) ||
            t.isFunctionExpression(declaration.init))
        ) {
          const componentName = declaration.id.name;

          if (
            shouldExtractComponent(declaration, minLines, mode, componentNames)
          ) {
            const componentCode = generate(path.node).code;

            // Crear el archivo del componente
            const componentFilePath = getComponentFilePath(
              outputDir,
              componentName
            );
            createComponentFile(componentFilePath, componentCode, sourceCode);

            extractedComponents.push(componentName);
          }
        }
      });
    },
  });

  return extractedComponents;
}

/**
 * Determina si un nodo debe ser extraído como componente
 */
function shouldExtractComponent(
  node: any,
  minLines: number,
  mode: 'auto' | 'manual',
  componentNames: string[]
): boolean {
  // En modo manual, solo extraer los componentes especificados
  if (mode === 'manual') {
    const nodeName =
      node.id?.name ||
      (t.isVariableDeclarator(node) && t.isIdentifier(node.id)
        ? node.id.name
        : '');
    return componentNames.includes(nodeName);
  }

  // En modo automático, extraer componentes basados en el tamaño
  const code = generate(node).code;
  const lineCount = code.split('\n').length;

  return lineCount >= minLines;
}

/**
 * Genera la ruta de archivo para el componente extraído
 */
function getComponentFilePath(
  outputDir: string,
  componentName: string
): string {
  return path.join(outputDir, `${componentName}.tsx`);
}

/**
 * Crea el archivo del componente con las importaciones necesarias
 */
function createComponentFile(
  filePath: string,
  componentCode: string,
  sourceCode: string
) {
  // Extraer importaciones relevantes del archivo fuente
  const imports = extractRelevantImports(sourceCode, componentCode);

  // Crear contenido del archivo del componente
  const fileContent = `${imports}

${componentCode}

export default ${getComponentNameFromCode(componentCode)};
`;

  // Asegurarse de que el directorio exista
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  // Escribir el archivo
  fs.writeFileSync(filePath, fileContent, 'utf-8');
}

/**
 * Extrae las importaciones relevantes para el componente
 */
function extractRelevantImports(
  sourceCode: string,
  componentCode: string
): string {
  // Extraer todas las importaciones del archivo fuente
  const importRegex = /import\s+.*?from\s+['"].*?['"]/g;
  const allImports = sourceCode.match(importRegex) || [];

  // Filtrar solo las importaciones relevantes para el componente
  return allImports
    .filter(importStmt => {
      // Extraer los elementos importados
      const importRegex = /import\s+{([^}]*)}/;
      const importMatch = importRegex.exec(importStmt);
      const importedElements = importMatch?.[1] || '';
      const elements = importedElements.split(',').map(e => e.trim());

      // Verificar si algún elemento importado se usa en el componente
      return elements.some(element => componentCode.includes(element));
    })
    .join('\n');
}

/**
 * Obtiene el nombre del componente desde el código
 */
function getComponentNameFromCode(code: string): string {
  // Extraer el nombre de función o variable del componente
  const functionRegex = /function\s+(\w+)/;
  const functionMatch = functionRegex.exec(code);
  if (functionMatch) return functionMatch[1];

  const constRegex = /const\s+(\w+)/;
  const constMatch = constRegex.exec(code);
  if (constMatch) return constMatch[1];

  return '';
}

/**
 * Actualiza el archivo original para importar los componentes extraídos
 */
export function updateSourceFile(
  sourcePath: string,
  extractedComponents: string[],
  relativePath: string
): void {
  let sourceCode = fs.readFileSync(sourcePath, 'utf-8');

  // Agregar importaciones para los componentes extraídos
  const imports = extractedComponents
    .map(name => `import ${name} from '${relativePath}/${name}';`)
    .join('\n');

  // Insertar importaciones después de las importaciones existentes
  const lastImportIndex = sourceCode.lastIndexOf('import');
  const lastImportLineEnd = sourceCode.indexOf('\n', lastImportIndex);

  if (lastImportIndex !== -1) {
    sourceCode =
      sourceCode.substring(0, lastImportLineEnd + 1) +
      '\n' +
      imports +
      '\n' +
      sourceCode.substring(lastImportLineEnd + 1);
  } else {
    sourceCode = imports + '\n\n' + sourceCode;
  }

  // Escribir el archivo actualizado
  fs.writeFileSync(sourcePath, sourceCode, 'utf-8');
}
