// The top of every inner page (v13): a short paper-cut street with the page's title on its dark
// near plane, moving apart as you scroll.
import type { StreetTime } from '@pohnch/ui/theme';
import { Parallax } from './Parallax';
import { Street } from './Street';

export function PageHead({ title, time = 'morning', ur }: { title: string; time?: StreetTime; ur: boolean }) {
  return (
    <Parallax className="page-head" style={{ marginTop: -76 }}>
      <Street time={time} h={300} />
      <h1 className={ur ? 'display-ur' : 'display-en'}>{title}</h1>
    </Parallax>
  );
}
