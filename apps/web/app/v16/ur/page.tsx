// Temporary preview address for the v16 Urdu home page (moves to /ur after review).
import { Home } from '../../_v16/Home';
export const metadata = { robots: { index: false } };
export default function Page() { return <Home lang="ur" homeHref="/v16/ur" otherHref="/v16" />; }
