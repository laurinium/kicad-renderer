import fs from 'node:fs';
import KicadPCBParser from "./src/KicadPCBParser";

const data = fs.readFileSync('data.txt', 'utf8')

const parser = new KicadPCBParser()

let res = parser.parse(data)
fs.writeFileSync('parsed.json', JSON.stringify(res, null, 2))
fs.writeFileSync('test.svg', parser.draw(res))