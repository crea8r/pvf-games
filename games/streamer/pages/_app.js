// pages/_app.js
import '../styles/global.css'   // <-- import once here

export default function MyApp({ Component, pageProps }) {
  return <Component {...pageProps} />
}