"""Generate a synthetic textual PDF with an exact byte size; never commit the output."""
import argparse
import io
from pathlib import Path
from pypdf import PdfWriter
from pypdf.generic import NameObject, DictionaryObject, DecodedStreamObject


def make_pdf(size):
    writer=PdfWriter();page=writer.add_blank_page(400,400)
    font=DictionaryObject({NameObject('/Type'):NameObject('/Font'),NameObject('/Subtype'):NameObject('/Type1'),NameObject('/BaseFont'):NameObject('/Helvetica')})
    page[NameObject('/Resources')]=DictionaryObject({NameObject('/Font'):DictionaryObject({NameObject('/F1'):font})})
    text=DecodedStreamObject();text.set_data(b'BT /F1 12 Tf 20 200 Td (Redes privadas permitem estudar infraestrutura.) Tj ET')
    page[NameObject('/Contents')]=writer._add_object(text)
    padding=DecodedStreamObject();writer._add_object(padding)
    length=size-1024
    for _ in range(5):
        padding.set_data(b'x'*length)
        output=io.BytesIO();writer.write(output)
        data=output.getvalue()
        if len(data)==size:
            return data
        length+=size-len(data)
    raise RuntimeError('Could not produce exact fixture size')


if __name__=='__main__':
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('output',type=Path)
    parser.add_argument('--size-mib',type=int,default=80)
    args=parser.parse_args()
    args.output.write_bytes(make_pdf(args.size_mib*1024**2))
    print('Synthetic PDF bytes:',args.output.stat().st_size)
