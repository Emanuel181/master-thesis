import { NextResponse } from 'next/server';
import { auth } from '@/auth';

// WASM formatters
import initClang, { format as formatClang } from '@wasm-fmt/clang-format';
import initRuff, { format as formatRuff } from '@wasm-fmt/ruff_fmt';
import initGofmt, { format as formatGo } from '@wasm-fmt/gofmt';

// Prettier + plugins
import prettier from 'prettier';
import PluginJava from 'prettier-plugin-java';
import * as PluginPHP from '@prettier/plugin-php';

export async function POST(request) {
    try {
        // Auth check
        const session = await auth();
        if (!session?.user) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        const { code, language } = await request.json();

        if (!code || typeof code !== 'string') {
            return NextResponse.json(
                { error: 'Code is required and must be a string.' },
                { status: 400 }
            );
        }

        if (!language || typeof language !== 'string') {
            return NextResponse.json(
                { error: 'Language is required and must be a string.' },
                { status: 400 }
            );
        }

        const lang = language.toLowerCase().trim();
        let formattedCode = '';

        /* -----------------------------------------------------------
         *  PYTHON via Ruff WASM
         * --------------------------------------------------------- */
        if (['python', 'py'].includes(lang)) {
            await initRuff();

            const ruffOptions = {
                indent_style: 'space',
                indent_width: 4,
                line_width: 88,
                quote_style: 'double',
                magic_trailing_comma: 'respect',
            };

            formattedCode = formatRuff(code, 'main.py', ruffOptions);
        }

        /* -----------------------------------------------------------
         *  GO via Gofmt WASM
         * --------------------------------------------------------- */
        else if (['go', 'golang'].includes(lang)) {
            await initGofmt();
            formattedCode = formatGo(code);
        }

        /* -----------------------------------------------------------
         *  C / C++ / C# / ObjC via Clang-Format WASM
         * --------------------------------------------------------- */
        else if (
            ['c', 'cpp', 'c++', 'csharp', 'cs', 'c#', 'objectivec', 'objc'].includes(lang)
        ) {
            await initClang();

            const isCSharp = ['csharp', 'cs', 'c#'].includes(lang);
            const isCpp = ['cpp', 'c++'].includes(lang);

            const clangStyle = JSON.stringify({
                BasedOnStyle: isCSharp ? 'Microsoft' : 'Google',
                IndentWidth: 4,
                ColumnLimit: 100,
            });

            const fileExt = isCSharp ? 'cs'
                : isCpp ? 'cpp'
                    : lang === 'objc' || lang === 'objectivec' ? 'm'
                        : 'c';

            formattedCode = formatClang(code, `file.${fileExt}`, clangStyle);
        }

        /* -----------------------------------------------------------
         *  EVERYTHING ELSE → PRETTIER
         * --------------------------------------------------------- */
        else {
            const map = {
                javascript: 'babel',
                js: 'babel',
                jsx: 'babel',

                typescript: 'typescript',
                ts: 'typescript',
                tsx: 'typescript',

                css: 'css',
                scss: 'css',

                html: 'html',
                json: 'json',

                java: 'java',
                php: 'php',
            };

            const parser = map[lang];

            if (!parser) {
                return NextResponse.json(
                    { error: `Language '${language}' is not supported.` },
                    { status: 400 }
                );
            }

            let plugins = [];
            if (lang === 'java') {
                plugins = [PluginJava];
                console.log('[API] Using Java plugin:', !!PluginJava, 'parser:', parser);
            }
            if (lang === 'php') plugins = [PluginPHP];

            try {
                formattedCode = await prettier.format(code, {
                    parser,
                    plugins,
                    tabWidth: lang === 'java' || lang === 'php' ? 4 : 2,
                    printWidth: 80,
                    trailingComma: 'es5',
                });
            } catch (prettierError) {
                console.error('[API] Prettier error for', lang, ':', prettierError.message);
                throw prettierError;
            }
        }

        return NextResponse.json({ success: true, formattedCode, language });
    } catch (error) {
        console.error('Formatting Error:', error);
        console.error('Error stack:', error.stack);
        return NextResponse.json(
            {
                error: 'Failed to format code',
                details: error?.message || String(error),
            },
            { status: 422 }
        );
    }
}
