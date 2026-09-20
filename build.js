import * as esbuild from 'esbuild';

try {
  await esbuild.build({
    entryPoints: ['app.js'],
    bundle: true,
    minify: true,
    sourcemap: false,
    target: ['es2020'],
    outfile: 'dist/app.bundle.js',
    format: 'iife',
    platform: 'browser'
  });
  console.log('✓ Build complete');
} catch (error) {
  console.error('Build failed:', error);
  process.exit(1);
}
