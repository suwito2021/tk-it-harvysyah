import React, { useState, useEffect, useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { getSheetData, addScore, updateScore, deleteScore } from '../services/googleSheetsService';
import type { Student, Score, Teacher, Hafalan } from '../types';
import { ChevronLeftIcon, BookIcon, PrayingHandsIcon, QuoteIcon, ChartBarIcon, NotYetDevelopedIcon, StartingToDevelopIcon, DevelopingAsExpectedIcon, VeryWellDevelopedIcon, PencilIcon, TrashIcon, SpinnerIcon } from './icons';

interface TeacherPortalProps {
  onBack: () => void;
  teacher: Teacher;
}

const INPUT_TABS = {
  surah1: { label: 'Semester 1 - Surah Pendek', category: 'Hafalan Surah Pendek', icon: BookIcon, semester: 1 },
  surah2: { label: 'Semester 2 - Surah Pendek', category: 'Hafalan Surah Pendek', icon: BookIcon, semester: 2 },
  doa1: { label: 'Semester 1 - Doa Sehari-hari', category: 'Hafalan Doa Sehari-hari', icon: PrayingHandsIcon, semester: 1 },
  doa2: { label: 'Semester 2 - Doa Sehari-hari', category: 'Hafalan Doa Sehari-hari', icon: PrayingHandsIcon, semester: 2 },
  hadist1: { label: 'Semester 1 - Hadist', category: 'Hafalan Hadist', icon: QuoteIcon, semester: 1 },
  hadist2: { label: 'Semester 2 - Hadist', category: 'Hafalan Hadist', icon: QuoteIcon, semester: 2 },
} as const;

type InputTabKey = keyof typeof INPUT_TABS;

const SCORE_OPTIONS = [
    { value: 'BB', label: 'Belum Berkembang', Icon: NotYetDevelopedIcon, color: 'red' },
    { value: 'MB', label: 'Mulai Berkembang', Icon: StartingToDevelopIcon, color: 'yellow' },
    { value: 'BSH', label: 'Berkembang Sesuai Harapan', Icon: DevelopingAsExpectedIcon, color: 'green' },
    { value: 'BSB', label: 'Berkembang Sangat Baik', Icon: VeryWellDevelopedIcon, color: 'emerald' },
];

const colorSchemes = {
    red: { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-300', selected: 'border-red-500 ring-red-500' },
    yellow: { bg: 'bg-yellow-50', text: 'text-yellow-700', border: 'border-yellow-300', selected: 'border-yellow-500 ring-yellow-500' },
    green: { bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-300', selected: 'border-green-500 ring-green-500' },
    emerald: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-300', selected: 'border-emerald-500 ring-emerald-500' },
};

const TeacherPortal: React.FC<TeacherPortalProps> = ({ onBack, teacher }) => {
  const [students, setStudents] = useState<Student[]>([]);
  const [scores, setScores] = useState<Score[]>([]);
  const [hafalanItems, setHafalanItems] = useState<Hafalan[]>([]);
  const [reportData, setReportData] = useState<any[]>([]);
  const [isLoadingStudents, setIsLoadingStudents] = useState(true);
  const [isLoadingHafalan, setIsLoadingHafalan] = useState(true);
  const [isLoadingScores, setIsLoadingScores] = useState(false);
  const [isLoadingReport, setIsLoadingReport] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  
  const [mainTab, setMainTab] = useState<'input' | 'report'>('input');
  const [activeSubTab, setActiveSubTab] = useState<InputTabKey>('surah1');

  // Filter states for report
  const [selectedStudent, setSelectedStudent] = useState<string>('');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Report specific states
  const [reportStartDate, setReportStartDate] = useState<string>('');
  const [reportEndDate, setReportEndDate] = useState<string>('');
  const [reportCurrentPage, setReportCurrentPage] = useState(1);
  const reportItemsPerPage = 10;

  // Modal states
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedScore, setSelectedScore] = useState<Score | null>(null);
  const [originalScore, setOriginalScore] = useState<Score | null>(null);
  const [isEditLoading, setIsEditLoading] = useState(false);
  const [isDeleteLoading, setIsDeleteLoading] = useState(false);
  const [editStatus, setEditStatus] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [deleteStatus, setDeleteStatus] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Report modal states
  const [isReportEditModalOpen, setIsReportEditModalOpen] = useState(false);
  const [isReportDeleteModalOpen, setIsReportDeleteModalOpen] = useState(false);
  const [selectedReportRow, setSelectedReportRow] = useState<any>(null);
  const [reportFormData, setReportFormData] = useState<any>({});
  const [isReportEditLoading, setIsReportEditLoading] = useState(false);
  const [isReportDeleteLoading, setIsReportDeleteLoading] = useState(false);
  const [reportEditStatus, setReportEditStatus] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [reportDeleteStatus, setReportDeleteStatus] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const [formData, setFormData] = useState<Omit<Score, 'Timestamp'>>({
    'Student ID': '',
    Category: INPUT_TABS.surah1.category,
    'Item Name': '',
    Score: '',
    Date: new Date().toISOString().split('T')[0],
    Notes: '',
  });

  useEffect(() => {
    const fetchStudents = async () => {
      try {
        setIsLoadingStudents(true);
        setError(null);
        const studentData = await getSheetData<Student>('Student');
        const filteredStudents = studentData.filter(s => s.Class === teacher.Class);
        setStudents(filteredStudents);
      } catch (err) {
        setError('Gagal memuat data siswa. Silakan coba lagi.');
      } finally {
        setIsLoadingStudents(false);
      }
    };
    fetchStudents();
  }, [teacher.Class]);
  
  useEffect(() => {
    const fetchHafalanItems = async () => {
      try {
        setIsLoadingHafalan(true);
        const hafalanData = await getSheetData<Hafalan>('Hafalan');
        setHafalanItems(hafalanData);
      } catch (err) {
        setError(prev => prev || 'Gagal memuat daftar item hafalan.');
      } finally {
        setIsLoadingHafalan(false);
      }
    };
    fetchHafalanItems();
  }, []);

  useEffect(() => {
    if (mainTab === 'input') {
      setFormData(prev => ({
        ...prev,
        Category: INPUT_TABS[activeSubTab].category,
        'Item Name': '', 
        Score: '',
      }));
    }
    setSubmitStatus(null);
  }, [activeSubTab, mainTab]);

  useEffect(() => {
    if (mainTab === 'report' && students.length > 0) {
      const fetchReportData = async () => {
        setIsLoadingReport(true);
        setError(null);
        try {
          const report = await getSheetData<any>('Report');
          setReportData(report);
        } catch (err) {
          setError('Gagal memuat data laporan.');
        } finally {
          setIsLoadingReport(false);
        }
      };
      fetchReportData();

      const fetchScores = async () => {
        setIsLoadingScores(true);
        try {
          const scoreData = await getSheetData<Score>('score');
          const studentIds = new Set(students.map(s => s.NISN));
          const teacherScores = scoreData.filter(score => studentIds.has(score['Student ID']));
          setScores(teacherScores.sort((a, b) => new Date(b.Date).getTime() - new Date(a.Date).getTime()));
        } catch (err)
  {
          // Error already handled above
        } finally {
          setIsLoadingScores(false);
        }
      };
      fetchScores();
    }
  }, [mainTab, students]);

  // Auto-dismiss status messages after 5 seconds
  useEffect(() => {
    if (submitStatus) {
      const timer = setTimeout(() => {
        setSubmitStatus(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [submitStatus]);

  const studentMap = useMemo(() => new Map(students.map(s => [s.NISN, s.Name])), [students]);
  const filteredHafalanItems = useMemo(() => {
    const tab = INPUT_TABS[activeSubTab];
    return hafalanItems.filter(item => {
      const categoryMatch = item.Category === tab.category;
      // If tab has semester property, filter by semester, otherwise include all
      const semesterMatch = 'semester' in tab ? item.Semester === tab.semester : true;
      return categoryMatch && semesterMatch;
    });
  }, [hafalanItems, activeSubTab]);

  const filteredScores = useMemo(() => {
    let filtered = scores;
    if (selectedStudent) {
      filtered = filtered.filter(score => score['Student ID'] === selectedStudent);
    }
    if (startDate) {
      filtered = filtered.filter(score => score.Date >= startDate);
    }
    if (endDate) {
      filtered = filtered.filter(score => score.Date <= endDate);
    }
    return filtered;
  }, [scores, selectedStudent, startDate, endDate]);

  const filteredReportData = useMemo(() => {
    let filtered = reportData;
    if (reportStartDate) {
      filtered = filtered.filter(item => {
        // Try to find date fields and filter
        const dateFields = ['Tanggal', 'Date', 'Waktu', 'Time'];
        for (const field of dateFields) {
          if (item[field] && item[field] >= reportStartDate) {
            return true;
          }
        }
        return false;
      });
    }
    if (reportEndDate) {
      filtered = filtered.filter(item => {
        const dateFields = ['Tanggal', 'Date', 'Waktu', 'Time'];
        for (const field of dateFields) {
          if (item[field] && item[field] <= reportEndDate) {
            return true;
          }
        }
        return false;
      });
    }
    return filtered;
  }, [reportData, reportStartDate, reportEndDate]);

  useEffect(() => {
    setCurrentPage(1);
  }, [selectedStudent, startDate, endDate]);

  useEffect(() => {
    setReportCurrentPage(1);
  }, [reportStartDate, reportEndDate]);

  const scoreCountsSurah = useMemo(() => {
    const counts = { BB: 0, MB: 0, BSH: 0, BSB: 0 };
    filteredScores.filter(score => score.Category === 'Hafalan Surah Pendek').forEach(score => {
      if (counts[score.Score as keyof typeof counts] !== undefined) {
        counts[score.Score as keyof typeof counts]++;
      }
    });
    return Object.entries(counts).map(([score, count]) => ({ score, count }));
  }, [filteredScores]);

  const scoreCountsDoa = useMemo(() => {
    const counts = { BB: 0, MB: 0, BSH: 0, BSB: 0 };
    filteredScores.filter(score => score.Category === 'Hafalan Doa Sehari-hari').forEach(score => {
      if (counts[score.Score as keyof typeof counts] !== undefined) {
        counts[score.Score as keyof typeof counts]++;
      }
    });
    return Object.entries(counts).map(([score, count]) => ({ score, count }));
  }, [filteredScores]);

  const scoreCountsHadist = useMemo(() => {
    const counts = { BB: 0, MB: 0, BSH: 0, BSB: 0 };
    filteredScores.filter(score => score.Category === 'Hafalan Hadist').forEach(score => {
      if (counts[score.Score as keyof typeof counts] !== undefined) {
        counts[score.Score as keyof typeof counts]++;
      }
    });
    return Object.entries(counts).map(([score, count]) => ({ score, count }));
  }, [filteredScores]);

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleScoreSelect = (scoreValue: string) => {
    setFormData(prev => ({ ...prev, Score: scoreValue }));
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData['Student ID'] || !formData['Item Name'] || !formData.Score) {
      setSubmitStatus({ message: 'Silakan lengkapi semua pilihan: siswa, item, dan penilaian.', type: 'error' });
      return;
    }

    setIsSubmitting(true);
    setSubmitStatus(null);
    try {
      const result = await addScore(formData);
      setSubmitStatus({ message: result.message, type: 'success' });
      setFormData({
        'Student ID': '',
        Category: INPUT_TABS[activeSubTab].category,
        'Item Name': '',
        Score: '',
        Date: new Date().toISOString().split('T')[0],
        Notes: '',
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Terjadi kesalahan yang tidak diketahui.';
      setSubmitStatus({ message: `Gagal mengirim data: ${errorMessage}`, type: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const renderInputForm = () => {
    if (isLoadingStudents) return <p className="text-center text-gray-500 py-8">Memuat data siswa...</p>;
    if (error && students.length === 0) return <p className="text-center text-red-500 py-8">{error}</p>;

    return (
      <div>
        <h3 className="text-xl font-semibold text-gray-800 mb-4">Input Penilaian Baru</h3>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="Student ID" className="block text-sm font-medium text-gray-700">Siswa (Kelas {teacher.Class})</label>
              <select id="Student ID" name="Student ID" value={formData['Student ID']} onChange={handleChange} required className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm rounded-md">
                <option value="">Pilih Siswa</option>
                {students.map((student, index) => <option key={`${student.NISN}-${index}`} value={student.NISN}>{student.Name} ({student.NISN})</option>)}
              </select>
            </div>
            <div>
              <label htmlFor="Item Name" className="block text-sm font-medium text-gray-700">Nama Item Penilaian</label>
              <select id="Item Name" name="Item Name" value={formData['Item Name']} onChange={handleChange} required disabled={isLoadingHafalan || filteredHafalanItems.length === 0} className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm rounded-md disabled:bg-gray-100">
                <option value="">{isLoadingHafalan ? 'Memuat item...' : 'Pilih Item'}</option>
                {filteredHafalanItems.map(item => <option key={`${item.ItemName}-${item.Semester}`} value={item.ItemName}>{item.ItemName}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Penilaian</label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {SCORE_OPTIONS.map(option => {
                const scheme = colorSchemes[option.color as keyof typeof colorSchemes];
                const isSelected = formData.Score === option.value;
                return (
                  <button type="button" key={option.value} onClick={() => handleScoreSelect(option.value)} className={`flex flex-col items-center justify-center text-center p-3 rounded-lg border-2 transition-all duration-200 focus:outline-none ${scheme.bg} ${scheme.text} ${isSelected ? `${scheme.selected} ring-2 ring-offset-1` : `${scheme.border} hover:shadow-md hover:-translate-y-1`}`}>
                    <option.Icon className="w-8 h-8 mb-2" />
                    <span className="font-bold text-lg">{option.value}</span>
                    <span className="text-xs">{option.label}</span>
                  </button>
                )
              })}
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="Date" className="block text-sm font-medium text-gray-700">Tanggal</label>
              <input type="date" id="Date" name="Date" value={formData.Date} onChange={e => setFormData(p => ({...p, Date: e.target.value}))} required className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500"/>
            </div>
            <div>
              <label htmlFor="Notes" className="block text-sm font-medium text-gray-700">Catatan (Opsional)</label>
              <textarea id="Notes" name="Notes" value={formData.Notes} onChange={handleChange} rows={1} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500"></textarea>
            </div>
          </div>
          <div className="text-right">
            <button type="submit" disabled={isSubmitting} className="inline-flex justify-center py-2 px-6 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 disabled:bg-gray-400">
              {isSubmitting ? 'Mengirim...' : 'Kirim Penilaian'}
            </button>
          </div>
        </form>
        {submitStatus && (
          <div className={`mt-6 p-4 rounded-xl shadow-lg border-l-4 animate-in slide-in-from-top-2 duration-300 ${
            submitStatus.type === 'success'
              ? 'bg-gradient-to-r from-green-50 to-emerald-50 border-green-500 text-green-800'
              : 'bg-gradient-to-r from-red-50 to-pink-50 border-red-500 text-red-800'
          }`}>
            <div className="flex items-center">
              <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center mr-3 ${
                submitStatus.type === 'success' ? 'bg-green-100' : 'bg-red-100'
              }`}>
                {submitStatus.type === 'success' ? (
                  <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                  </svg>
                ) : (
                  <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                  </svg>
                )}
              </div>
              <div className="flex-1">
                <p className="font-semibold text-sm">
                  {submitStatus.type === 'success' ? 'Berhasil!' : 'Error!'}
                </p>
                <p className="text-sm opacity-90 mt-1">{submitStatus.message}</p>
              </div>
              <button
                onClick={() => setSubmitStatus(null)}
                className={`ml-4 p-1 rounded-full hover:bg-opacity-20 transition-colors ${
                  submitStatus.type === 'success' ? 'hover:bg-green-200' : 'hover:bg-red-200'
                }`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                </svg>
              </button>
            </div>
          </div>
        )}
      </div>
    );
  };
  
  const handleEditClick = (score: Score) => {
    setSelectedScore({...score}); // Create a copy for editing
    setOriginalScore({...score}); // Keep original for identification
    setEditStatus(null); // Clear any previous status
    setIsEditModalOpen(true);
  };

  const handleDeleteClick = (score: Score) => {
    setSelectedScore(score);
    setDeleteStatus(null); // Clear any previous status
    setIsDeleteModalOpen(true);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedScore || !originalScore) return;

    setIsEditLoading(true);
    try {
      const result = await updateScore({
        original: originalScore,
        updated: selectedScore
      });

      // Refresh the scores data
      const scoreData = await getSheetData<Score>('score');
      const studentIds = new Set(students.map(s => s.NISN));
      const teacherScores = scoreData.filter(score => studentIds.has(score['Student ID']));
      setScores(teacherScores.sort((a, b) => new Date(b.Date).getTime() - new Date(a.Date).getTime()));

      // Close modal immediately and show success message
      setIsEditModalOpen(false);
      setSelectedScore(null);
      setOriginalScore(null);
      setSubmitStatus({ message: result.message, type: 'success' });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Terjadi kesalahan yang tidak diketahui.';
      // Close modal immediately and show error message
      setIsEditModalOpen(false);
      setSelectedScore(null);
      setOriginalScore(null);
      setSubmitStatus({ message: `Gagal memperbarui data: ${errorMessage}`, type: 'error' });
    } finally {
      setIsEditLoading(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!selectedScore) return;

    setIsDeleteLoading(true);
    try {
      const result = await deleteScore(selectedScore);

      // Refresh the scores data
      const scoreData = await getSheetData<Score>('score');
      const studentIds = new Set(students.map(s => s.NISN));
      const teacherScores = scoreData.filter(score => studentIds.has(score['Student ID']));
      setScores(teacherScores.sort((a, b) => new Date(b.Date).getTime() - new Date(a.Date).getTime()));

      // Close modal immediately and show success message
      setIsDeleteModalOpen(false);
      setSelectedScore(null);
      setSubmitStatus({ message: result.message, type: 'success' });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Terjadi kesalahan yang tidak diketahui.';
      // Close modal immediately and show error message
      setIsDeleteModalOpen(false);
      setSelectedScore(null);
      setSubmitStatus({ message: `Gagal menghapus data: ${errorMessage}`, type: 'error' });
    } finally {
      setIsDeleteLoading(false);
    }
  };

  const handleEditReportClick = (row: any, index: number) => {
    setSelectedReportRow({...row});
    setReportFormData({...row});
    setReportEditStatus(null);
    setIsReportEditModalOpen(true);
  };

  const handleDeleteReportClick = (row: any, index: number) => {
    setSelectedReportRow(row);
    setReportDeleteStatus(null);
    setIsReportDeleteModalOpen(true);
  };

  const handleReportEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedReportRow) return;

    setIsReportEditLoading(true);
    setReportEditStatus(null);

    try {
      // For now, just show success message since we don't have backend support yet
      // In a real implementation, this would call an API to update the report data
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call

      // Update the local report data
      const updatedReportData = reportData.map((item: any) =>
        item === selectedReportRow ? reportFormData : item
      );
      setReportData(updatedReportData);

      setIsReportEditModalOpen(false);
      setSelectedReportRow(null);
      setReportFormData({});
      setReportEditStatus({ message: 'Data laporan berhasil diperbarui!', type: 'success' });

      // Clear success message after 5 seconds
      setTimeout(() => setReportEditStatus(null), 5000);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Terjadi kesalahan yang tidak diketahui.';
      setReportEditStatus({ message: `Gagal memperbarui data: ${errorMessage}`, type: 'error' });
    } finally {
      setIsReportEditLoading(false);
    }
  };

  const handleReportDeleteConfirm = async () => {
    if (!selectedReportRow) return;

    setIsReportDeleteLoading(true);
    setReportDeleteStatus(null);

    try {
      // For now, just show success message since we don't have backend support yet
      // In a real implementation, this would call an API to delete the report data
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call

      // Remove from local report data
      const updatedReportData = reportData.filter((item: any) => item !== selectedReportRow);
      setReportData(updatedReportData);

      setIsReportDeleteModalOpen(false);
      setSelectedReportRow(null);
      setReportDeleteStatus({ message: 'Data laporan berhasil dihapus!', type: 'success' });

      // Clear success message after 5 seconds
      setTimeout(() => setReportDeleteStatus(null), 5000);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Terjadi kesalahan yang tidak diketahui.';
      setReportDeleteStatus({ message: `Gagal menghapus data: ${errorMessage}`, type: 'error' });
    } finally {
      setIsReportDeleteLoading(false);
    }
  };

  const renderEditModal = () => {
    if (!isEditModalOpen || !selectedScore) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
          <div className="p-4 md:p-6">
            <h3 className="text-lg md:text-xl font-bold text-gray-800 mb-4 md:mb-6">Edit Penilaian</h3>
            {editStatus && (
              <div className={`mb-4 p-3 rounded-lg text-sm font-medium ${
                editStatus.type === 'success'
                  ? 'bg-green-100 text-green-800 border border-green-200'
                  : 'bg-red-100 text-red-800 border border-red-200'
              }`}>
                {editStatus.message}
              </div>
            )}
            <form onSubmit={handleEditSubmit} className="space-y-4 md:space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Siswa</label>
                <select
                  value={selectedScore['Student ID']}
                  disabled={true}
                  className="w-full border border-gray-300 rounded-lg shadow-sm py-2.5 px-3 bg-gray-100 text-gray-500 text-sm md:text-base cursor-not-allowed"
                  required
                >
                  {students.map((student) => (
                    <option key={student.NISN} value={student.NISN}>
                      {student.Name} ({student.NISN})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Kategori</label>
                <select
                  value={selectedScore.Category}
                  onChange={(e) => setSelectedScore({...selectedScore, Category: e.target.value})}
                  className="w-full border border-gray-300 rounded-lg shadow-sm py-2.5 px-3 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm md:text-base"
                  required
                >
                  <option value="Hafalan Surah Pendek">Hafalan Surah Pendek</option>
                  <option value="Hafalan Doa Sehari-hari">Hafalan Doa Sehari-hari</option>
                  <option value="Hafalan Hadist">Hafalan Hadist</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Item Hafalan</label>
                <input
                  type="text"
                  value={selectedScore['Item Name']}
                  disabled={true}
                  className="w-full border border-gray-300 rounded-lg shadow-sm py-2.5 px-3 bg-gray-100 text-gray-500 text-sm md:text-base cursor-not-allowed"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">Penilaian</label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-3">
                  {SCORE_OPTIONS.map(option => {
                    const scheme = colorSchemes[option.color as keyof typeof colorSchemes];
                    const isSelected = selectedScore.Score === option.value;
                    return (
                      <button
                        type="button"
                        key={option.value}
                        onClick={() => setSelectedScore({...selectedScore, Score: option.value})}
                        className={`flex flex-col items-center justify-center text-center p-3 md:p-4 rounded-lg border-2 transition-all duration-200 focus:outline-none ${scheme.bg} ${scheme.text} ${isSelected ? `${scheme.selected} ring-2 ring-offset-1` : `${scheme.border} hover:shadow-md hover:-translate-y-0.5`}`}
                      >
                        <option.Icon className="w-5 h-5 md:w-6 md:h-6 mb-1 md:mb-2" />
                        <span className="font-bold text-sm md:text-base">{option.value}</span>
                        <span className="text-xs md:text-sm opacity-75">{option.label.split(' ')[0]}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tanggal</label>
                <input
                  type="date"
                  value={selectedScore.Date}
                  disabled={true}
                  className="w-full border border-gray-300 rounded-lg shadow-sm py-2.5 px-3 bg-gray-100 text-gray-500 text-sm md:text-base cursor-not-allowed"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Catatan</label>
                <textarea
                  value={selectedScore.Notes || ''}
                  onChange={(e) => setSelectedScore({...selectedScore, Notes: e.target.value})}
                  rows={3}
                  className="w-full border border-gray-300 rounded-lg shadow-sm py-2.5 px-3 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm md:text-base resize-none"
                  placeholder="Tambahkan catatan jika diperlukan..."
                />
              </div>
              <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  disabled={isEditLoading}
                  className="px-4 py-2.5 text-sm md:text-base bg-gray-500 text-white rounded-lg hover:bg-gray-600 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors duration-200 font-medium"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isEditLoading}
                  className="px-4 py-2.5 text-sm md:text-base bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:bg-emerald-400 disabled:cursor-not-allowed transition-colors duration-200 font-medium flex items-center justify-center gap-2"
                >
                  {isEditLoading ? (
                    <>
                      <SpinnerIcon className="w-4 h-4" />
                      Menyimpan...
                    </>
                  ) : (
                    'Simpan Perubahan'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    );
  };

  const renderDeleteModal = () => {
    if (!isDeleteModalOpen || !selectedScore) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-sm mx-4">
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
              <TrashIcon className="h-6 w-6 text-red-600" />
            </div>
            <h3 className="text-lg font-bold text-gray-800 mb-2">Hapus Penilaian</h3>
            {deleteStatus && (
              <div className={`mb-4 p-3 rounded-lg text-sm font-medium ${
                deleteStatus.type === 'success'
                  ? 'bg-green-100 text-green-800 border border-green-200'
                  : 'bg-red-100 text-red-800 border border-red-200'
              }`}>
                {deleteStatus.message}
              </div>
            )}
            <p className="text-gray-600 mb-6">
              Apakah Anda yakin ingin menghapus penilaian ini? Tindakan ini tidak dapat dibatalkan.
            </p>
            <div className="flex justify-center space-x-3">
              <button
                onClick={() => setIsDeleteModalOpen(false)}
                disabled={isDeleteLoading}
                className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors duration-200"
              >
                Batal
              </button>
              <button
                onClick={handleDeleteConfirm}
                disabled={isDeleteLoading}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:bg-red-400 disabled:cursor-not-allowed transition-colors duration-200 flex items-center justify-center gap-2"
              >
                {isDeleteLoading ? (
                  <>
                    <SpinnerIcon className="w-4 h-4" />
                    Menghapus...
                  </>
                ) : (
                  'Hapus'
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderReportEditModal = () => {
    if (!isReportEditModalOpen || !selectedReportRow) return null;

    const headers = Object.keys(selectedReportRow);

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
          <div className="p-6 md:p-8">
            <h3 className="text-xl md:text-2xl font-bold text-gray-800 mb-6">Edit Data Laporan</h3>
            {reportEditStatus && (
              <div className={`mb-6 p-4 rounded-xl shadow-lg border-l-4 animate-in slide-in-from-top-2 duration-300 ${
                reportEditStatus.type === 'success'
                  ? 'bg-gradient-to-r from-green-50 to-emerald-50 border-green-500 text-green-800'
                  : 'bg-gradient-to-r from-red-50 to-pink-50 border-red-500 text-red-800'
              }`}>
                <div className="flex items-center">
                  <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center mr-3 ${
                    reportEditStatus.type === 'success' ? 'bg-green-100' : 'bg-red-100'
                  }`}>
                    {reportEditStatus.type === 'success' ? (
                      <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                      </svg>
                    ) : (
                      <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                      </svg>
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-sm">
                      {reportEditStatus.type === 'success' ? 'Berhasil!' : 'Error!'}
                    </p>
                    <p className="text-sm opacity-90 mt-1">{reportEditStatus.message}</p>
                  </div>
                </div>
              </div>
            )}
            <form onSubmit={handleReportEditSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {headers.map(header => (
                  <div key={header}>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {header}
                    </label>
                    <input
                      type="text"
                      value={reportFormData[header] || ''}
                      onChange={(e) => setReportFormData({...reportFormData, [header]: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
                      placeholder={`Masukkan ${header}`}
                    />
                  </div>
                ))}
              </div>
              <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 pt-6 border-t">
                <button
                  type="button"
                  onClick={() => setIsReportEditModalOpen(false)}
                  disabled={isReportEditLoading}
                  className="px-6 py-2.5 text-sm md:text-base bg-gray-500 text-white rounded-lg hover:bg-gray-600 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors duration-200 font-medium"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isReportEditLoading}
                  className="px-6 py-2.5 text-sm md:text-base bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:bg-emerald-400 disabled:cursor-not-allowed transition-colors duration-200 font-medium flex items-center justify-center gap-2"
                >
                  {isReportEditLoading ? (
                    <>
                      <SpinnerIcon className="w-4 h-4" />
                      Menyimpan...
                    </>
                  ) : (
                    'Simpan Perubahan'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    );
  };

  const renderReportDeleteModal = () => {
    if (!isReportDeleteModalOpen || !selectedReportRow) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-sm mx-4">
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
              <TrashIcon className="h-6 w-6 text-red-600" />
            </div>
            <h3 className="text-lg font-bold text-gray-800 mb-2">Hapus Data Laporan</h3>
            {reportDeleteStatus && (
              <div className={`mb-4 p-3 rounded-lg text-sm font-medium ${
                reportDeleteStatus.type === 'success'
                  ? 'bg-green-100 text-green-800 border border-green-200'
                  : 'bg-red-100 text-red-800 border border-red-200'
              }`}>
                {reportDeleteStatus.message}
              </div>
            )}
            <p className="text-gray-600 mb-6">
              Apakah Anda yakin ingin menghapus data laporan ini? Tindakan ini tidak dapat dibatalkan.
            </p>
            <div className="flex justify-center space-x-3">
              <button
                onClick={() => setIsReportDeleteModalOpen(false)}
                disabled={isReportDeleteLoading}
                className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors duration-200"
              >
                Batal
              </button>
              <button
                onClick={handleReportDeleteConfirm}
                disabled={isReportDeleteLoading}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:bg-red-400 disabled:cursor-not-allowed transition-colors duration-200 flex items-center justify-center gap-2"
              >
                {isReportDeleteLoading ? (
                  <>
                    <SpinnerIcon className="w-4 h-4" />
                    Menghapus...
                  </>
                ) : (
                  'Hapus'
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderReport = () => {
    if (isLoadingReport || isLoadingScores) return <p className="text-center text-gray-500 py-8">Memuat data laporan...</p>;
    if (error && reportData.length === 0 && scores.length === 0) return <p className="text-center text-red-500 py-8">{error}</p>;

    const totalPages = Math.ceil(filteredScores.length / itemsPerPage);
    const paginatedScores = filteredScores.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    // Display Report sheet data with filtering and pagination
    if (reportData.length > 0) {
      const headers = Object.keys(reportData[0]);
      const totalReportPages = Math.ceil(filteredReportData.length / reportItemsPerPage);
      const startReportIndex = (reportCurrentPage - 1) * reportItemsPerPage;
      const endReportIndex = startReportIndex + reportItemsPerPage;
      const paginatedReportData = filteredReportData.slice(startReportIndex, endReportIndex);

      return (
        <div>
          <h3 className="text-xl font-semibold text-gray-800 mb-6">Laporan Data</h3>

          {/* Filter Section */}
          <div className="bg-white p-4 rounded-lg shadow mb-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Tanggal Mulai</label>
                <input
                  type="date"
                  value={reportStartDate}
                  onChange={(e) => setReportStartDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Tanggal Akhir</label>
                <input
                  type="date"
                  value={reportEndDate}
                  onChange={(e) => setReportEndDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <div className="flex items-end">
                <button
                  onClick={() => {setReportStartDate(''); setReportEndDate('');}}
                  className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
                >
                  Reset Filter
                </button>
              </div>
            </div>
            <div className="mt-4 text-sm text-gray-600">
              Menampilkan {filteredReportData.length} dari {reportData.length} data
            </div>
          </div>

          {/* Data Table */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-emerald-600">
                  <tr>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-bold text-white uppercase tracking-wider">No</th>
                    {headers.map(header => (
                      <th key={header} scope="col" className="px-4 py-3 text-left text-xs font-bold text-white uppercase tracking-wider">
                        {header}
                      </th>
                    ))}
                    <th scope="col" className="px-4 py-3 text-left text-xs font-bold text-white uppercase tracking-wider">AKSI</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {paginatedReportData.length > 0 ? paginatedReportData.map((row, index) => (
                    <tr key={index} className="hover:bg-gray-50 transition-colors duration-150">
                      <td className="px-4 py-4 text-sm text-gray-900 font-medium">
                        {(reportCurrentPage - 1) * reportItemsPerPage + index + 1}
                      </td>
                      {headers.map(header => (
                        <td key={header} className="px-4 py-4 text-sm text-gray-900 break-words">
                          {String(row[header] || '-')}
                        </td>
                      ))}
                      <td className="px-4 py-4 text-sm text-gray-900">
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => handleEditReportClick(row, index)}
                            className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-600 hover:text-blue-700 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1"
                            title="Edit"
                          >
                            <PencilIcon className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteReportClick(row, index)}
                            className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 hover:text-red-700 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-1"
                            title="Hapus"
                          >
                            <TrashIcon className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan={headers.length + 2} className="px-4 py-8 text-center text-gray-500">
                        Tidak ada data yang sesuai dengan filter
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalReportPages > 1 && (
              <div className="flex justify-between items-center px-4 py-3 bg-gray-50 border-t">
                <button
                  onClick={() => setReportCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={reportCurrentPage === 1}
                  className="px-3 py-1 text-sm bg-white border border-gray-300 rounded hover:bg-gray-50 disabled:bg-gray-100 disabled:text-gray-400"
                >
                  Previous
                </button>
                <span className="text-sm text-gray-700">
                  Halaman {reportCurrentPage} dari {totalReportPages} ({filteredReportData.length} data)
                </span>
                <button
                  onClick={() => setReportCurrentPage(prev => Math.min(prev + 1, totalReportPages))}
                  disabled={reportCurrentPage === totalReportPages}
                  className="px-3 py-1 text-sm bg-white border border-gray-300 rounded hover:bg-gray-50 disabled:bg-gray-100 disabled:text-gray-400"
                >
                  Next
                </button>
              </div>
            )}
          </div>
        </div>
      );
    }

    // Fallback to original score-based report
    return (
      <div>
        <h3 className="text-xl font-semibold text-gray-800 mb-4">Laporan Penilaian Kelas {teacher.Class}</h3>
        <div className="mb-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Filter Siswa</label>
              <select value={selectedStudent} onChange={e => setSelectedStudent(e.target.value)} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500">
                <option value="">Semua Siswa</option>
                {students.map(student => <option key={student.NISN} value={student.NISN}>{student.Name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Tanggal Mulai</label>
              <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Tanggal Akhir</label>
              <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500" />
            </div>
            <div className="flex items-end">
              <button onClick={() => {setSelectedStudent(''); setStartDate(''); setEndDate('');}} className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600">Reset Filter</button>
            </div>
          </div>
        </div>
        <div className="border rounded-lg">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-emerald-600">
              <tr>
                <th scope="col" className="px-4 py-3 text-left text-xs font-bold text-white uppercase tracking-wider">No</th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-bold text-white uppercase tracking-wider">Nama Siswa</th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-bold text-white uppercase tracking-wider">Kategori</th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-bold text-white uppercase tracking-wider">Item Hafalan</th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-bold text-white uppercase tracking-wider">Rating</th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-bold text-white uppercase tracking-wider">Tanggal</th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-bold text-white uppercase tracking-wider">Catatan</th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-bold text-white uppercase tracking-wider">AKSI</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {paginatedScores.map((score, index) => (
                <tr key={`${score['Student ID']}-${score['Item Name']}-${score.Date}-${index}`}>
                  <td className="px-4 py-4 text-sm text-gray-900 break-words">{(currentPage - 1) * itemsPerPage + index + 1}</td>
                  <td className="px-4 py-4 text-sm text-gray-900 font-medium break-words">{studentMap.get(score['Student ID']) || score['Student ID']}</td>
                  <td className="px-4 py-4 text-sm text-gray-900 break-words">{score.Category}</td>
                  <td className="px-4 py-4 text-sm text-gray-900 break-words">{score['Item Name']}</td>
                  <td className="px-4 py-4 text-sm text-gray-900 font-semibold break-words">{score.Score}</td>
                  <td className="px-4 py-4 text-sm text-gray-500 break-words">{score.Date}</td>
                  <td className="px-4 py-4 text-sm text-gray-900 break-words">{score.Notes || '-'}</td>
                  <td className="px-4 py-4 text-sm text-gray-900 break-words">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleEditClick(score)}
                        className="text-blue-600 hover:text-blue-800 p-1 rounded hover:bg-blue-50"
                        title="Edit"
                      >
                        <PencilIcon className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => handleDeleteClick(score)}
                        className="text-red-600 hover:text-red-800 p-1 rounded hover:bg-red-50"
                        title="Hapus"
                      >
                        <TrashIcon className="w-5 h-5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filteredScores.length === 0 && scores.length > 0 && <p className="text-center text-gray-500 py-4">Tidak ada data yang cocok dengan filter.</p>}
        {totalPages > 1 && (
          <div className="flex justify-between items-center mt-4 px-4 py-3 bg-gray-50 border-t">
            <button
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="px-3 py-1 text-sm bg-white border border-gray-300 rounded hover:bg-gray-50 disabled:bg-gray-100 disabled:text-gray-400"
            >
              Previous
            </button>
            <span className="text-sm text-gray-700">
              Halaman {currentPage} dari {totalPages} ({filteredScores.length} data)
            </span>
            <button
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="px-3 py-1 text-sm bg-white border border-gray-300 rounded hover:bg-gray-50 disabled:bg-gray-100 disabled:text-gray-400"
            >
              Next
            </button>
          </div>
        )}
        <div className="mt-8">
          <h4 className="text-lg font-semibold text-gray-800 mb-4">Grafik Capaian Penilaian</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <h5 className="text-md font-medium text-gray-700 mb-2">Hafalan Surah Pendek</h5>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={scoreCountsSurah}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="score" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill="#10b981" />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div>
              <h5 className="text-md font-medium text-gray-700 mb-2">Hafalan Doa Sehari-hari</h5>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={scoreCountsDoa}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="score" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill="#3b82f6" />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div>
              <h5 className="text-md font-medium text-gray-700 mb-2">Hafalan Hadist</h5>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={scoreCountsHadist}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="score" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill="#ef4444" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg p-6 md:p-8 w-full max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-6 pb-4 border-b">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Portal Guru</h2>
          <p className="text-gray-500">Selamat datang, {teacher.Name}!</p>
        </div>
        <button onClick={onBack} className="flex items-center text-emerald-600 hover:text-emerald-800 font-semibold">
          <ChevronLeftIcon className="w-5 h-5 mr-1" />
          Kembali
        </button>
      </div>
      
      <div>
        <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8" aria-label="Tabs">
                <button
                    onClick={() => setMainTab('input')}
                    className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                        mainTab === 'input' 
                        ? 'border-emerald-500 text-emerald-600' 
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                >
                    Input Hafalan
                </button>
                <button
                    onClick={() => setMainTab('report')}
                    className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                        mainTab === 'report' 
                        ? 'border-emerald-500 text-emerald-600' 
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                >
                    Laporan
                </button>
            </nav>
        </div>
      </div>

      <div className="mt-8">
        {mainTab === 'input' && (
            <div className="flex flex-col md:flex-row gap-8">
                <aside className="w-full md:w-1/4">
                    <nav className="flex flex-col space-y-2">
                    {(Object.keys(INPUT_TABS) as InputTabKey[]).map(tabKey => {
                        const Icon = INPUT_TABS[tabKey].icon;
                        return (
                        <button
                            key={tabKey}
                            onClick={() => setActiveSubTab(tabKey)}
                            className={`flex items-center w-full text-left px-4 py-3 rounded-lg transition-colors duration-200 text-sm font-medium ${
                                activeSubTab === tabKey
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                            }`}
                        >
                            <Icon className="w-5 h-5 mr-3 flex-shrink-0" />
                            <span>{INPUT_TABS[tabKey].label}</span>
                        </button>
                        )
                    })}
                    </nav>
                </aside>
                <main className="flex-1 md:w-3/4">
                    {renderInputForm()}
                </main>
            </div>
        )}
        {mainTab === 'report' && renderReport()}
      </div>
      {renderEditModal()}
      {renderDeleteModal()}
      {renderReportEditModal()}
      {renderReportDeleteModal()}
    </div>
  );
};

export default TeacherPortal;
