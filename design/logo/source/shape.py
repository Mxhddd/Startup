import uharfbuzz as hb, sys
from fontTools.ttLib import TTFont
def shape(path, text, feats=None):
    blob = hb.Blob.from_file_path(path); face = hb.Face(blob); font = hb.Font(face)
    buf = hb.Buffer(); buf.add_str(text); buf.guess_segment_properties()
    buf.language='ur'
    hb.shape(font, buf, feats or {})
    tt = TTFont(path); order = tt.getGlyphOrder()
    out=[]; x=0
    for info,pos in zip(buf.glyph_infos, buf.glyph_positions):
        out.append((order[info.codepoint], info.cluster, x+pos.x_offset, pos.y_offset, pos.x_advance))
        x+=pos.x_advance
    return out
if __name__=='__main__':
    for f in sys.argv[1:]:
        print('==',f)
        for g in shape('fonts/'+f,'پہنچ'): print('  ',g)
