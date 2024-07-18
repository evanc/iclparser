import { ICLParser } from "./ICLParser";
import { createReadStream } from "fs";
import { mkdir, writeFile } from "fs/promises";

async function parseICL(filename: string, outputDir: string): Promise<void> {

  if (!filename || !outputDir) {
    throw new Error("Please provide a filename and output directory");
  }

  console.log(`Parsing ICL file: ${filename} to output directory: ${outputDir}`);

  const data = await new Promise<Buffer>((resolve, reject) => {
    const stream = createReadStream(`./${filename}`);
    const chunks: Buffer[] = [];
    stream.on('data', (chunk: Buffer) => {
      chunks.push(chunk);
    });
    stream.on('end', () => {
      const buffer = Buffer.concat(chunks);
      resolve(buffer);
    });
    stream.on('error', (error) => {
      reject(error);
    });
  });
  const iclParser = new ICLParser(data);
  
  const output = await iclParser.parse();
  
  const records = output.map(record => record.toObject());

  await mkdir(outputDir, { recursive: true });

  let counter = 1;
  for (const record of records) {
    for (const key in record) {
      if (
        Buffer.isBuffer(record[key]) &&
        record[key].length > 2 &&
        record[key][0] === 0x49 &&
        record[key][1] === 0x49
      ) {
        const filename = `${outputDir}/${record.recordType}_${record.recordTypeName}_${key}_${counter}.tiff`;
        await writeFile(filename, record[key]);
        counter++;
      }
    }
  }

  const recordsJSON = (JSON.stringify(
    records,
    null,
    2
  ));
  
  await writeFile(`${outputDir}/icl.json`, recordsJSON);
  
};


const args = process.argv.slice(2);
const filename = args[0];
const outputDir = args[1];

if (!filename || !outputDir) {
  console.error("call with an input filename and an output directory: npm run parse <filename> <outputDir>");
  process.exit(1);
}

parseICL(filename, outputDir).catch((error) => {
  console.error("Error parsing ICL file:", error);
});
