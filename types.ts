export interface Teacher {
  Name: string;
  Phone: string;
  Class: string;
}

export interface Student {
  Name: string;
  NISN: string;
  Class: string;
}

export interface Principal {
  Name: string;
  Phone: string;
}

export interface Score {
  "Student ID": string;
  Category: string;
  "Item Name": string;
  Score: string;
  Date: string;
  Notes: string;
  Timestamp?: string;
}

export interface Hafalan {
  Category: 'Hafalan Surah Pendek' | 'Hafalan Doa Sehari-hari' | 'Hafalan Hadist';
  ItemName: string;
  Semester?: number;
}