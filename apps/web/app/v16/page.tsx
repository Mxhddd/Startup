// Temporary preview address for the v16 home page (moves to / after review).
import { Home } from '../_v16/Home';
export const metadata = { robots: { index: false } };
export default function Page() { return <Home lang="en" homeHref="/v16" otherHref="/v16/ur" />; }
