import { ScrollViewStyleReset } from 'expo-router/html';
import type { PropsWithChildren } from 'react';

/**
 * Custom HTML root for Expo Web — enables SPA deep links and viewport meta.
 */
export default function Root({ children }: PropsWithChildren) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, maximum-scale=1, viewport-fit=cover"
        />
        <title>Flirty Greece</title>
        <meta
          name="description"
          content="Flirty Greece — it starts with a Swipe. Dating for Greece."
        />
        <ScrollViewStyleReset />
        <style dangerouslySetInnerHTML={{ __html: responsiveRootCss }} />
      </head>
      <body>{children}</body>
    </html>
  );
}

const responsiveRootCss = `
html, body, #root {
  height: 100%;
  width: 100%;
  margin: 0;
  padding: 0;
  background: #F3F4FB;
}
body {
  overflow-y: auto;
  -webkit-font-smoothing: antialiased;
}
#root {
  display: flex;
  flex-direction: column;
}
`;
