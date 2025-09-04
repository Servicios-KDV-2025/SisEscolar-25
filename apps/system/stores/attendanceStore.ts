import { useState } from 'react'

export function useAttendance(initialData: any[] = []) {
  const [attendanceData, setAttendanceData] = useState(initialData);

  const updateAttendance = (studentClassId: string, field: string, value: any) => {
    setAttendanceData(prev =>
      prev.map(item =>
        item.studentClassId === studentClassId
          ? { ...item, [field]: value }
          : item
      )
    );
  };

  const resetAttendance = (newData: any[]) => {
    setAttendanceData(newData)
  }

  const getAttendanceForSubmit = () => {
    return attendanceData.map(item => ({
      studentClassId: item.studentClassId,
      present: item.present ?? false,
      justified: item.justified ?? false,
      comments: item.comments || ''
    }));
  };

  return {
    attendanceData,
    updateAttendance,
    resetAttendance,
    getAttendanceForSubmit
  }
}