import EBCDIC from "ebcdic-ascii";
import { ICLRecord } from "./iclRecord";

const RECORD_LENGTH_SIZE = 4;

export class ICLParser {
  #data: Buffer;
  #ebcdic: EBCDIC;


  constructor(data: Buffer) {
    this.#data = data;
    this.#ebcdic = new EBCDIC('0037');
  }

  getRecords(): Array<ICLRecord> {
    const records: Array<ICLRecord> = [];
    let offset = 0;

    while (offset < this.#data.length) {
      const recordLength = this.#data.readUInt32BE(offset);
      offset += RECORD_LENGTH_SIZE;

      const record = this.#data.slice(offset, offset + recordLength);
      records.push(new ICLRecord(record));

      offset += recordLength;
    }

    return records;
  }

  parse() {
    // Parse the data
    const records = this.getRecords();

    // Walk through records and build a structure
    return records;

  }

}
