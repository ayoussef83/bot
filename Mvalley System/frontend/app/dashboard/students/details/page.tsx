'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { studentsService, Student } from '@/lib/services';

export default function StudentDetailPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const id = searchParams.get('id');

  const [student, setStudent] = useState<Student | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (id) {
      fetchStudent(id);
    } else {
      setError('Missing student id');
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const fetchStudent = async (studentId: string) => {
    try {
      const response = await studentsService.getById(studentId);
      setStudent(response.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load student');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="p-6">Loading student details...</div>;
  }

  if (error || !student) {
    return (
      <div className="p-6">
        <div className="text-red-600">{error || 'Student not found'}</div>
        <button
          onClick={() => router.back()}
          className="mt-4 text-indigo-600 hover:text-indigo-900"
        >
          ← Back to Students
        </button>
      </div>
    );
  }

  return (
    <div className="p-6">
      <button
        onClick={() => router.back()}
        className="mb-4 text-indigo-600 hover:text-indigo-900"
      >
        ← Back to Students
      </button>

      <div className="bg-white rounded-lg shadow p-6">
        <h1 className="text-3xl font-bold mb-6">
          {student.firstName} {student.lastName}
        </h1>

        <div className="grid grid-cols-2 gap-6">
          <div>
            <h3 className="text-sm font-medium text-gray-500">Age</h3>
            <p className="mt-1 text-lg">{student.age}</p>
          </div>

          <div>
            <h3 className="text-sm font-medium text-gray-500">Learning Track</h3>
            <p className="mt-1 text-lg capitalize">{student.learningTrack}</p>
          </div>

          <div>
            <h3 className="text-sm font-medium text-gray-500">Status</h3>
            <span
              className={`mt-1 inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                student.status === 'active'
                  ? 'bg-green-100 text-green-800'
                  : student.status === 'paused'
                    ? 'bg-yellow-100 text-yellow-800'
                    : 'bg-gray-100 text-gray-800'
              }`}
            >
              {student.status}
            </span>
          </div>

          {student.email && (
            <div>
              <h3 className="text-sm font-medium text-gray-500">Email</h3>
              <p className="mt-1 text-lg">{student.email}</p>
            </div>
          )}

          {student.phone && (
            <div>
              <h3 className="text-sm font-medium text-gray-500">Phone</h3>
              <p className="mt-1 text-lg">{student.phone}</p>
            </div>
          )}

          {student.class && (
            <div>
              <h3 className="text-sm font-medium text-gray-500">Class</h3>
              <p className="mt-1 text-lg">{student.class.name}</p>
            </div>
          )}

          {student.parent && (
            <div>
              <h3 className="text-sm font-medium text-gray-500">Parent</h3>
              <p className="mt-1 text-lg">
                {student.parent.firstName} {student.parent.lastName}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}


