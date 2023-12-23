import cls from 'classnames';
import html2canvas, { Options } from 'html2canvas';
import React, { CSSProperties, Ref, useImperativeHandle, useMemo, useRef } from 'react';
import styles from './style.module.scss';

export type PaperName = string;

export type Millimeter = number;
export type PixelPerInch = number;

export type QRCodeURL = string;
export type BlobURL = string;
export type FinalPaperImageURL = BlobURL | null;

export interface IPaper {
  width: Millimeter;
  height: Millimeter;
}

export const MillimetersPerInch = 25.4;

export const Papers: Record<PaperName, IPaper> = {
  A4: {
    width:  210,
    height: 297,
  },
};

export interface ITag {
  name: string;
  qrCode: QRCodeURL;
}

export interface IPaperProps {
  className?: string;
  tags: ITag[];
  ppi?: PixelPerInch;
  columnCount?: number;
  paperName?: keyof typeof Papers;
  /**
   * The most printer always has its default blank border
   */
  blankWidth?: number;
}

export interface IPaperRef {
  getDataURL: (options?: Partial<Options>) => Promise<FinalPaperImageURL>;
}

export function Paper({
  className,
  paperName = 'A4',
  ppi = 200,
  columnCount = 2,
  tags,
  blankWidth = 0,
}: IPaperProps, ref: Ref<IPaperRef>): React.ReactElement {
  const paperRef = useRef<HTMLDivElement | null>(null);
  const paper = useMemo(() => Papers[paperName], [paperName]);
  const paperStyle = useMemo<CSSProperties>(() => {
    return {
      width:   `${paper.width / MillimetersPerInch * ppi - blankWidth}px`,
      height:  `${paper.height / MillimetersPerInch * ppi - blankWidth}px`,
      padding: `${blankWidth}px`,
    };
  }, [blankWidth, paper.height, paper.width, ppi]);
  const tagsInColumns = useMemo(() => {
    const rows: ITag[][] = [];
    for (let i = 0; i < Math.floor(tags.length / columnCount); i++) {
      for (let j = 0; j < columnCount; j++) {
        if (!rows[i]) {
          rows[i] = [];
        }
        rows[i].push(tags[j + i]);
      }
    }
    return rows;
  }, [columnCount, tags]);
  useImperativeHandle(ref, () => ({
    getDataURL: async (options?: Partial<Options>): Promise<FinalPaperImageURL>  => {
      return new Promise(resolve => {
        if (!paperRef.current) {
          resolve(null);
          return;
        }
        html2canvas(paperRef.current, options).then(canvas => {
          canvas.toBlob((blob: Blob | null) => {
            if (!blob) {
              return resolve(null);
            }
            const url = URL.createObjectURL(blob);
            resolve(url);
          }, 'image/png', 1);
        });
      });
    },
  }), []);
  return <div className={cls(styles.wrapper, className)}>
    <div ref={paperRef} className={styles.paper} style={paperStyle}>
      <table className={styles.table}>
        <tbody>
          {tagsInColumns.map((col, index) => <tr key={index} className={styles.tagCol}>
            {col.map((tag, tagIndex) => <td key={tagIndex} className={styles.tag}>
              <div className={styles.contentWrapper}>
                <div className={styles.qrCode}>
                  <img src={tag.qrCode} alt={tag.qrCode}/>
                </div>
                <div className={styles.name}>{tag.name}</div>
              </div>
            </td>)}
          </tr>)}
        </tbody>
      </table>
    </div>
  </div>;
}

export default React.forwardRef(Paper);
