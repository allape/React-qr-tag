import { useCallback, useEffect, useRef, useState } from 'react';
import styles from './App.module.scss';
import Paper, { IPaperRef, ITag, PixelPerInch } from './components/Paper';
import * as qrcode from 'qrcode';

const PPI: PixelPerInch = 300;

function App() {
  const paperRef = useRef<IPaperRef | null>(null);

  const dataSourceRef = useRef<HTMLTextAreaElement | null>(null);
  const transformerFuncRef = useRef<HTMLTextAreaElement | null>(null);

  const [tags, setTags] = useState<ITag[]>([]);

  const handlePreview = useCallback( async () => {
    try {
      window.localStorage.setItem('transformerFuncRef.current.value', transformerFuncRef.current?.value || '');
      const newTags: ITag[] | unknown =
        new Function(
          'dataSourceString',
          transformerFuncRef.current?.value || 'return [];',
        )(dataSourceRef.current?.value);
      if (newTags instanceof Array) {
        const qrCodeURLs = await Promise.all(newTags.map(tag => qrcode.toDataURL(tag.qrCode, {
          type:         'image/webp',
          width:        PPI,
          margin:       0,
          rendererOpts: {
            quality: 1,
          },
        })));
        setTags(newTags.map((tag, index) => ({
          ...tag,
          qrCode: qrCodeURLs[index],
        })));
      }
    } catch (e) {
      console.error(e);
      alert((e as Error).message || `${e}`);
    }
  }, []);
  const handlePrint = useCallback( async () => {
    const url = await paperRef.current?.getDataURL();
    if (!url) {
      return;
    }
    const w = window.open(url);
    w?.addEventListener('close', () => {
      URL.revokeObjectURL(url);
    });
  }, []);
  useEffect(() => {
    transformerFuncRef.current!.value = window.localStorage.getItem('transformerFuncRef.current.value') || '';
    const handleKeyup = (e: KeyboardEvent) => {
      if (e.key === 'p' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        handlePrint().then();
      }
    };
    window.addEventListener('keydown', handleKeyup);
    return () => {
      window.removeEventListener('keydown', handleKeyup);
    };
  }, [handlePrint]);
  return (
    <div className={styles.app}>
      <div className={styles.wrapper}>
        <p>Data source:</p>
        <textarea ref={dataSourceRef} rows={30}></textarea>
        <p>Transformer function, <br/>
          for example:
          {' return JSON.parse(dataSourceString).map(i => ({ name: i.name, qrCode: i.qrCodeURL }))'}
        </p>
        <textarea ref={transformerFuncRef} rows={10}></textarea>
        <p>
          {'return JSON.parse'}
          {'(dataSourceString).data.map(i => ({ name: i.name, qrCode: `warehouser://item/${i.id}` }));'}
        </p>
        <button type="button" onClick={handlePreview}>Preview</button>
        <hr/>
        <div className={styles.sticky}>
          <button type="button" onClick={handlePrint}>Print</button>
        </div>
        <hr/>
        <Paper ref={paperRef} className={styles.tagger} tags={tags} columnCount={4} ppi={PPI}/>
        <hr/>
      </div>
    </div>
  );
}

export default App;
