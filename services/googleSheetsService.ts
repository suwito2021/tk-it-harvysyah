import { Score } from '../types';
import { defaultHafalanData } from '../data/hafalanDefaults';
import hafalanData from '../data/hafalanSurahData.json';

const WEB_APP_URL = 'https://script.google.com/macros/s/AKfycbx0TT0W3YmYFALB9hMBr8CkAe_jr7wtoCf0e_qYg3jxiwXB5mQCRBVe8EKpgeWBYu7J/exec';
const TEACHER_CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vRbz8LUyBo51HkpA0O0_8srtlG-7RxWLvesNbnmC3shQB9qC6EbUzx3dvXp5lWnmk7BR3sGuERPWZbg/pub?gid=735271315&single=true&output=csv';
const STUDENT_CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vRbz8LUyBo51HkpA0O0_8srtlG-7RxWLvesNbnmC3shQB9qC6EbUzx3dvXp5lWnmk7BR3sGuERPWZbg/pub?gid=1983478163&single=true&output=csv';
const HAFALAN_CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vRbz8LUyBo51HkpA0O0_8srtlG-7RxWLvesNbnmC3shQB9qC6EbUzx3dvXp5lWnmk7BR3sGuERPWZbg/pub?gid=452521597&single=true&output=csv';
const PRINCIPAL_CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vRbz8LUyBo51HkpA0O0_8srtlG-7RxWLvesNbnmC3shQB9qC6EbUzx3dvXp5lWnmk7BR3sGuERPWZbg/pub?gid=1638530657&single=true&output=csv';
const SCORE_CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vRbz8LUyBo51HkpA0O0_8srtlG-7RxWLvesNbnmC3shQB9qC6EbUzx3dvXp5lWnmk7BR3sGuERPWZbg/pub?gid=0&single=true&output=csv';

/**
 * A simple CSV parser that handles quoted values containing commas.
 * @param csvText The text content of the CSV file.
 * @returns An array of objects.
 */
const parseCSV = <T,>(csvText: string): T[] => {
    // Trim whitespace and split into lines, handling both \n and \r\n
    const lines = csvText.trim().split(/\r?\n/);
    if (lines.length < 2) {
        // Not enough data for headers and rows
        return [];
    }

    const headers = lines[0].split(',').map(h => h.trim());
    const data: T[] = [];

    for (let i = 1; i < lines.length; i++) {
        // Skip empty lines
        if (!lines[i]) continue;

        const values = [];
        let current = '';
        let inQuotes = false;
        // This parser handles values with commas if they are wrapped in double quotes.
        // It does not handle escaped quotes ("") inside a quoted value, but is sufficient for this app's needs.
        for (const char of lines[i]) {
            if (char === '"') {
                inQuotes = !inQuotes;
                // We don't add the quote to the value itself
            } else if (char === ',' && !inQuotes) {
                values.push(current.trim());
                current = '';
            } else {
                current += char;
            }
        }
        values.push(current.trim());


        if (values.length === headers.length) {
            const entry = {} as T;
            headers.forEach((header, index) => {
                // Type assertion to allow dynamic property assignment
                (entry as any)[header] = values[index];
            });
            data.push(entry);
        }
    }
    return data;
};


export const getSheetData = async <T,>(sheetName: string): Promise<T[]> => {
  try {
    if (sheetName === 'Teacher') {
        const response = await fetch(TEACHER_CSV_URL);
        if (!response.ok) {
            throw new Error(`Error fetching Teacher CSV data: ${response.statusText}`);
        }
        const csvText = await response.text();
        return parseCSV<T>(csvText);
    } else if (sheetName === 'Student') {
        const response = await fetch(STUDENT_CSV_URL);
        if (!response.ok) {
            throw new Error(`Error fetching Student CSV data: ${response.statusText}`);
        }
        const csvText = await response.text();
        return parseCSV<T>(csvText);
    } else if (sheetName === 'Hafalan') {
        return hafalanData as T[];
    } else if (sheetName === 'Principal') {
        const response = await fetch(PRINCIPAL_CSV_URL);
        if (!response.ok) {
            throw new Error(`Error fetching Principal CSV data: ${response.statusText}`);
        }
        const csvText = await response.text();
        return parseCSV<T>(csvText);
    } else if (sheetName === 'score') {
        const response = await fetch(SCORE_CSV_URL);
        if (!response.ok) {
            throw new Error(`Error fetching Score CSV data: ${response.statusText}`);
        }
        const csvText = await response.text();
        return parseCSV<T>(csvText);
    }


    // Default logic for other sheets
    const response = await fetch(`${WEB_APP_URL}?action=getData&sheet=${sheetName}`);
    if (!response.ok) {
      throw new Error(`Error fetching ${sheetName} data: ${response.statusText}`);
    }
    const data = await response.json();
    if (data.error) {
        throw new Error(data.error);
    }
    return data as T[];
  } catch (error) {
    console.error(`Failed to fetch ${sheetName} data:`, error);
    throw error;
  }
};

export const addScore = async (scoreData: Omit<Score, 'Timestamp'>): Promise<{success: boolean, message: string}> => {
    try {
        const response = await fetch(WEB_APP_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'text/plain;charset=utf-8',
            },
            body: JSON.stringify({
                action: 'addScore',
                data: scoreData
            }),
        });

        if (!response.ok) {
            throw new Error(`Server responded with an error: ${response.status} ${response.statusText}`);
        }

        const result = await response.json();

        if (result.success) {
            return { success: true, message: result.message || 'Penilaian berhasil dikirim!' };
        } else {
            throw new Error(result.message || 'Terjadi kesalahan di server, namun server tidak memberikan detail.');
        }

    } catch (error) {
        console.error('Failed to add score:', error);
        throw error;
    }
};

export const updateScore = async (scoreData: { original: Score; updated: Score }): Promise<{success: boolean, message: string}> => {
    try {
        console.log('Sending update request with data:', scoreData);
        const response = await fetch(WEB_APP_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'text/plain;charset=utf-8',
            },
            body: JSON.stringify({
                action: 'updateScore',
                data: scoreData
            }),
        });

        if (!response.ok) {
            throw new Error(`Server responded with an error: ${response.status} ${response.statusText}`);
        }

        const result = await response.json();
        console.log('Update response:', result);

        if (result.success) {
            return { success: true, message: result.message || 'Penilaian berhasil diperbarui!' };
        } else {
            throw new Error(result.message || 'Terjadi kesalahan di server, namun server tidak memberikan detail.');
        }

    } catch (error) {
        console.error('Failed to update score:', error);
        throw error;
    }
};

export const deleteScore = async (scoreData: Score): Promise<{success: boolean, message: string}> => {
    try {
        const response = await fetch(WEB_APP_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'text/plain;charset=utf-8',
            },
            body: JSON.stringify({
                action: 'deleteScore',
                data: scoreData
            }),
        });

        if (!response.ok) {
            throw new Error(`Server responded with an error: ${response.status} ${response.statusText}`);
        }

        const result = await response.json();

        if (result.success) {
            return { success: true, message: result.message || 'Penilaian berhasil dihapus!' };
        } else {
            throw new Error(result.message || 'Terjadi kesalahan di server, namun server tidak memberikan detail.');
        }

    } catch (error) {
        console.error('Failed to delete score:', error);
        throw error;
    }
};