import pdfParse from 'pdf-parse';
import axios from 'axios';
import * as cheerio from 'cheerio';
import fs from 'fs/promises';

class DocumentService {
  // Procesar PDF
  async processPDF(filePath) {
    try {
      const dataBuffer = await fs.readFile(filePath);
      const data = await pdfParse(dataBuffer);
      
      return {
        text: data.text,
        pages: data.numpages,
        info: data.info
      };
    } catch (error) {
      console.error('Error procesando PDF:', error);
      throw new Error('No se pudo procesar el archivo PDF');
    }
  }

  // Procesar página web
  async processWebPage(url) {
    try {
      const response = await axios.get(url, {
        timeout: 30000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; APIIntelligenceBot/1.0)'
        }
      });

      const $ = cheerio.load(response.data);
      
      // Remover scripts, estilos y elementos innecesarios
      $('script').remove();
      $('style').remove();
      $('nav').remove();
      $('footer').remove();
      $('header').remove();
      $('.advertisement').remove();
      $('.ad').remove();

      // Extraer texto principal
      let text = '';
      
      // Priorizar main, article, section
      const mainContent = $('main, article, .content, .main-content, #content, #main');
      if (mainContent.length > 0) {
        text = mainContent.text();
      } else {
        text = $('body').text();
      }

      // Limpiar texto
      text = text
        .replace(/\s+/g, ' ')
        .replace(/\n+/g, '\n')
        .trim();

      // Extraer enlaces potenciales de API
      const apiLinks = [];
      $('a[href*="api"], a[href*="docs"], a[href*="documentation"]').each((i, elem) => {
        const href = $(elem).attr('href');
        const text = $(elem).text().trim();
        if (href && text) {
          apiLinks.push({ url: href, text });
        }
      });

      // Extraer bloques de código que puedan contener ejemplos de API
      const codeBlocks = [];
      $('pre, code').each((i, elem) => {
        const code = $(elem).text().trim();
        if (code.length > 0) {
          codeBlocks.push(code);
        }
      });

      return {
        text,
        title: $('title').text() || 'Sin título',
        apiLinks,
        codeBlocks
      };
    } catch (error) {
      console.error('Error procesando página web:', error);
      throw new Error('No se pudo procesar la página web');
    }
  }

  // Detectar tipo de autenticación mencionada en el texto
  detectAuthType(text) {
    const lowerText = text.toLowerCase();
    
    if (lowerText.includes('oauth') || lowerText.includes('oauth2')) {
      return 'oauth';
    } else if (lowerText.includes('bearer token') || lowerText.includes('authorization: bearer')) {
      return 'bearer';
    } else if (lowerText.includes('api key') || lowerText.includes('apikey') || lowerText.includes('x-api-key')) {
      return 'apikey';
    } else if (lowerText.includes('basic auth') || lowerText.includes('authorization: basic')) {
      return 'basic';
    } else {
      return 'custom';
    }
  }

  // Extraer URLs base de APIs del texto
  extractBaseUrls(text) {
    const urlRegex = /https?:\/\/[^\s<>"{}|\\^`\[\]]+api[^\s<>"{}|\\^`\[\]]*/gi;
    const matches = text.match(urlRegex);
    
    if (!matches) return [];
    
    // Deduplicar y limpiar
    return [...new Set(matches)].map(url => {
      // Limpiar caracteres finales comunes
      return url.replace(/[.,;:!?)]+$/, '');
    });
  }

  // Extraer endpoints del texto
  extractEndpoints(text) {
    const endpoints = [];
    
    // Patrón para detectar endpoints (GET /users, POST /api/items, etc.)
    const endpointRegex = /(GET|POST|PUT|DELETE|PATCH)\s+(\/[\w\-\/{}:]+)/gi;
    let match;
    
    while ((match = endpointRegex.exec(text)) !== null) {
      endpoints.push({
        method: match[1].toUpperCase(),
        path: match[2]
      });
    }
    
    return endpoints;
  }

  // Validar URL
  isValidUrl(string) {
    try {
      const url = new URL(string);
      return url.protocol === 'http:' || url.protocol === 'https:';
    } catch (_) {
      return false;
    }
  }
}

export default new DocumentService();
