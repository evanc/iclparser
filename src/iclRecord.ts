import EBCDIC from "ebcdic-ascii";
import {FieldDataType, iclRecordDefinitions} from "./iclRecordDefinitions";

type Fields = Record<string, string | Buffer>;

export class ICLRecord {

  #data: Buffer;
  ebcdic: EBCDIC;

  constructor(data: Buffer) {
    this.#data = data;
    this.ebcdic = new EBCDIC('0037');
  }

  get length() {
    return this.#data.length;
  }

  get type(): string {
    const bytes = this.#data.toString('hex', 0, 2);
    return this.ebcdic.toASCII(bytes);
  }

  get fieldData(): string {
    const bytes = this.#data.toString('hex', 2);
    return this.ebcdic.toASCII(bytes);
  }

  getBytes(start: number, length: number): Buffer {
    return this.#data.subarray(start, start + length);
  }

  getFieldValueString(start: number, length: number): string {
    const bytes = this.getBytes(start, length);
    const ebcdic = bytes.toString('hex');
    try {
      return this.ebcdic.toASCII(ebcdic).trim();
    } catch (_) {
      return ebcdic;
    }
  }

  toObject() {
    const recordDefinition = iclRecordDefinitions[this.type];
    
    if (!recordDefinition) {
      return {};
    }

    let i = 0;
    const fields: Fields = recordDefinition.fields.reduce((acc, field) => {

      // length is either defined directly or defined as the value of a different field
      let length: number;
      if (typeof field.length === 'number') {
        length = field.length;
      } else if (typeof acc[field.length] === 'string') {
        length = parseInt(acc[field.length] as string, 10);
      } else {
        throw new Error('Invalid field length');
      }

      if (isNaN(length)) {
        length = 0;
      }

      if (field.type === 'Binary') {
        acc[field.alias] = this.getBytes(i, length);
      } else {
        acc[field.alias] = this.getFieldValueString(i, length);
      }

      i += length;
      return acc;
    }, {
      recordTypeName: recordDefinition.name,
    } as Fields);

    return fields;
  }
}
