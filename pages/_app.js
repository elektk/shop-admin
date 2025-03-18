import '@/styles/globals.css';
import 'styles/stats.css';
import { SessionProvider } from "next-auth/react";
import { AccessProvider } from '@/components/AccessContext';

export default function App({Component, pageProps: { session, ...pageProps }}) {
  return (
    <SessionProvider session={session}>
      <AccessProvider>
        <Component {...pageProps}/>
      </AccessProvider>
    </SessionProvider>
  )
}
