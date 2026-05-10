import * as XLSX from 'xlsx';
import * as fs from 'fs';

async function checkHeaders() {
  try {
    const fileBuffer = fs.readFileSync('./Dash Acidentes.xlsx');
    const workbook = XLSX.read(fileBuffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const json = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
    console.log('HEADERS FOUND:', json[0]);
  } catch (e) {
    console.log('FILE NOT FOUND OR ERROR:', e.message);
  }
}

checkHeaders();
