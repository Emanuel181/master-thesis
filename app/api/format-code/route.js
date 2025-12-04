import { NextResponse } from 'next/server';
import prettier from 'prettier';

/**
 * API route to format code based on the programming language
 * POST /api/format-code
 * Body: { code: string, language: string }
 */
export async function POST(request) {
  try {
    const { code, language } = await request.json();

    if (!code || typeof code !== 'string') {
      return NextResponse.json(
        { error: 'Code is required and must be a string' },
        { status: 400 }
      );
    }

    if (!language || typeof language !== 'string') {
      return NextResponse.json(
        { error: 'Language is required and must be a string' },
        { status: 400 }
      );
    }

    let formattedCode;
    let parser;

    // Determine parser based on language
    switch (language.toLowerCase()) {
      case 'javascript':
      case 'js':
        parser = 'babel';
        break;
      case 'typescript':
      case 'ts':
        parser = 'typescript';
        break;
      case 'json':
        parser = 'json';
        break;
      case 'css':
        parser = 'css';
        break;
      case 'html':
        parser = 'html';
        break;
      case 'markdown':
      case 'md':
        parser = 'markdown';
        break;
      case 'yaml':
      case 'yml':
        parser = 'yaml';
        break;
      case 'python':
      case 'java':
      case 'go':
      case 'c':
      case 'cpp':
      case 'csharp':
        // These languages are not supported by Prettier
        return NextResponse.json(
          {
            error: 'Unsupported language for Prettier formatting',
            useMonaco: true,
            message: `${language} formatting is not supported by Prettier. Use Monaco Editor's built-in formatter.`
          },
          { status: 400 }
        );
      default:
        return NextResponse.json(
          {
            error: 'Unknown language',
            useMonaco: true,
            message: `Unknown language: ${language}. Use Monaco Editor's built-in formatter.`
          },
          { status: 400 }
        );
    }

    try {
      // Format code with Prettier
      formattedCode = await prettier.format(code, {
        parser,
        semi: true,
        singleQuote: false,
        tabWidth: 2,
        trailingComma: 'es5',
        printWidth: 80,
        arrowParens: 'always',
        bracketSpacing: true,
        endOfLine: 'lf',
      });

      return NextResponse.json({
        success: true,
        formattedCode,
        language,
      });
    } catch (prettierError) {
      console.error('Prettier formatting error:', prettierError);
      return NextResponse.json(
        {
          error: 'Failed to format code',
          details: prettierError.message,
          useMonaco: true,
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}

