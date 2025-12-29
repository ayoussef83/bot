'use client';

import { useEffect, useMemo, useState } from 'react';
import { studentsService, Student } from '@/lib/services';
import Link from 'next/link';
import SearchBar from '@/components/SearchBar';
import FilterBar from '@/components/FilterBar';
import { downloadExport } from '@/lib/export';

export default function StudentsPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [trackFilter, setTrackFilter] = useState('');
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    age: '',
    learningTrack: 'general',
    status: 'active',
    email: '',
    phone: '',
  });

  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    try {
      const response = await studentsService.getAll();
      setStudents(response.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load students');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingStudent) {
        await studentsService.update(editingStudent.id, {
          ...formData,
          age: parseInt(formData.age),
        });
      } else {
        await studentsService.create({
          ...formData,
          age: parseInt(formData.age),
        });
      }
      setShowForm(false);
      setEditingStudent(null);
      setFormData({
        firstName: '',
        lastName: '',
        age: '',
        learningTrack: 'general',
        status: 'active',
        email: '',
        phone: '',
      });
      fetchStudents();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to save student');
    }
  };

  const handleEdit = (student: Student) => {
    setEditingStudent(student);
    setFormData({
      firstName: student.firstName,
      lastName: student.lastName,
      age: student.age.toString(),
      learningTrack: student.learningTrack,
      status: student.status,
      email: student.email || '',
      phone: student.phone || '',
    });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this student?')) return;
    try {
      await studentsService.delete(id);
      fetchStudents();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to delete student');
    }
  };

  // Filter and search students
  const filteredStudents = useMemo(() => {
    return students.filter((student) => {
      const matchesSearch =
        searchTerm === '' ||
        `${student.firstName} ${student.lastName}`
          .toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        student.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.phone?.includes(searchTerm);

      const matchesStatus = statusFilter === '' || student.status === statusFilter;
      const matchesTrack = trackFilter === '' || student.learningTrack === trackFilter;

      return matchesSearch && matchesStatus && matchesTrack;
    });
  }, [students, searchTerm, statusFilter, trackFilter]);

  if (loading) {
    return <div className="p-6">Loading students...</div>;
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Students</h1>
        <div className="flex gap-2">
          <button
            onClick={() => downloadExport('students', 'xlsx')}
            className="bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-50"
          >
            Export Excel
          </button>
          <button
            onClick={() => downloadExport('students', 'pdf')}
            className="bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-50"
          >
            Export PDF
          </button>
          <button
            onClick={() => {
              setShowForm(true);
              setEditingStudent(null);
              setFormData({
                firstName: '',
                lastName: '',
                age: '',
                learningTrack: 'general',
                status: 'active',
                email: '',
                phone: '',
              });
            }}
            className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700"
          >
            Add Student
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {showForm && (
        <div className="bg-white p-6 rounded-lg shadow mb-6">
          <h2 className="text-xl font-semibold mb-4">
            {editingStudent ? 'Edit Student' : 'Add New Student'}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">First Name</label>
                <input
                  type="text"
                  required
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Last Name</label>
                <input
                  type="text"
                  required
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Age</label>
                <input
                  type="number"
                  required
                  min="5"
                  max="18"
                  value={formData.age}
                  onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Learning Track</label>
                <select
                  value={formData.learningTrack}
                  onChange={(e) => setFormData({ ...formData, learningTrack: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                >
                  <option value="general">General</option>
                  <option value="AI">AI</option>
                  <option value="robotics">Robotics</option>
                  <option value="coding">Coding</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Phone</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Status</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              >
                <option value="active">Active</option>
                <option value="paused">Paused</option>
                <option value="finished">Finished</option>
              </select>
            </div>

            <div className="flex gap-2">
              <button
                type="submit"
                className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700"
              >
                {editingStudent ? 'Update' : 'Create'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  setEditingStudent(null);
                }}
                className="bg-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-400"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Search and Filters */}
      <div className="mb-6 space-y-4">
        <SearchBar
          placeholder="Search by name, email, or phone..."
          value={searchTerm}
          onChange={setSearchTerm}
        />
        <FilterBar
          filters={[
            {
              key: 'status',
              label: 'Status',
              value: statusFilter,
              onChange: setStatusFilter,
              options: [
                { value: 'active', label: 'Active' },
                { value: 'paused', label: 'Paused' },
                { value: 'finished', label: 'Finished' },
              ],
            },
            {
              key: 'track',
              label: 'Learning Track',
              value: trackFilter,
              onChange: setTrackFilter,
              options: [
                { value: 'AI', label: 'AI' },
                { value: 'robotics', label: 'Robotics' },
                { value: 'coding', label: 'Coding' },
                { value: 'general', label: 'General' },
              ],
            },
          ]}
        />
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Age
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Track
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Class
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredStudents.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-4 text-center text-sm text-gray-500">
                  No students found
                </td>
              </tr>
            ) : (
              filteredStudents.map((student) => (
              <tr key={student.id}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <Link
                    href={`/dashboard/students/${student.id}`}
                    className="text-sm font-medium text-indigo-600 hover:text-indigo-900"
                  >
                    {student.firstName} {student.lastName}
                  </Link>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {student.age}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {student.learningTrack}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span
                    className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      student.status === 'active'
                        ? 'bg-green-100 text-green-800'
                        : student.status === 'paused'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {student.status}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {student.class?.name || '-'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <button
                    onClick={() => handleEdit(student)}
                    className="text-indigo-600 hover:text-indigo-900 mr-4"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(student.id)}
                    className="text-red-600 hover:text-red-900"
                  >
                    Delete
                  </button>
                </td>
              </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

