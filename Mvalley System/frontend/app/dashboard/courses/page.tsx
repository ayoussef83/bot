'use client';

import { useEffect, useMemo, useState } from 'react';
import StandardListView from '@/components/StandardListView';
import { ActionButton, Column } from '@/components/DataTable';
import EmptyState from '@/components/EmptyState';
import SummaryCard from '@/components/SummaryCard';
import { coursesService, Course, CourseLevel } from '@/lib/services';
import { FiPlus, FiTrash2, FiEdit, FiLayers } from 'react-icons/fi';

export default function CoursesPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [levels, setLevels] = useState<CourseLevel[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  const [showCourseModal, setShowCourseModal] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [courseName, setCourseName] = useState('');

  const [showLevelModal, setShowLevelModal] = useState(false);
  const [editingLevel, setEditingLevel] = useState<CourseLevel | null>(null);
  const [levelCourseId, setLevelCourseId] = useState('');
  const [levelName, setLevelName] = useState('');
  const [levelSort, setLevelSort] = useState(1);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [cRes, lRes] = await Promise.all([coursesService.list(), coursesService.listLevels()]);
      setCourses(cRes.data || []);
      setLevels(lRes.data || []);
      setError('');
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to load courses');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
  }, []);

  const rows = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    if (!q) return courses;
    return courses.filter((c) => c.name.toLowerCase().includes(q));
  }, [courses, searchTerm]);

  const columns: Column<Course>[] = [
    { key: 'name', label: 'Course', sortable: true, render: (v) => <span className="text-sm font-medium">{v}</span> },
    {
      key: 'levels',
      label: 'Levels',
      render: (_, row) => (
        <span className="text-sm text-gray-600">
          {(row.levels || levels.filter((l) => l.courseId === row.id)).length}
        </span>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      render: (_, row) => (
        <span className={`text-xs px-2 py-1 rounded ${row.isActive ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
          {row.isActive ? 'Active' : 'Inactive'}
        </span>
      ),
    },
  ];

  const actions = (row: Course): ActionButton[] => [
    {
      label: 'Levels',
      icon: <FiLayers className="w-4 h-4" />,
      onClick: () => {
        setEditingLevel(null);
        setLevelCourseId(row.id);
        setLevelName('');
        setLevelSort(1);
        setShowLevelModal(true);
      },
    },
    {
      label: 'Edit',
      icon: <FiEdit className="w-4 h-4" />,
      onClick: () => {
        setEditingCourse(row);
        setCourseName(row.name);
        setShowCourseModal(true);
      },
    },
    {
      label: 'Delete',
      variant: 'danger',
      icon: <FiTrash2 className="w-4 h-4" />,
      onClick: async () => {
        if (!confirm(`Delete course "${row.name}"?`)) return;
        try {
          await coursesService.delete(row.id);
          await fetchAll();
        } catch (err: any) {
          setError(err?.response?.data?.message || 'Failed to delete course');
        }
      },
    },
  ];

  const totalCourses = courses.length;
  const totalLevels = levels.length;

  return (
    <div className="space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded text-sm">
          {error}
        </div>
      )}

      <StandardListView
        title="Courses"
        subtitle="Manage courses and their levels"
        searchPlaceholder="Search courses..."
        onSearch={setSearchTerm}
        searchValue={searchTerm}
        columns={columns}
        data={rows}
        loading={loading}
        actions={actions}
        emptyMessage="No courses found"
        emptyState={<EmptyState title="No courses" message="Create your first course and define its levels." />}
        primaryAction={{
          label: 'Add Course',
          icon: <FiPlus className="w-4 h-4" />,
          onClick: () => {
            setEditingCourse(null);
            setCourseName('');
            setShowCourseModal(true);
          },
        }}
        summaryCards={
          <>
            <SummaryCard title="Courses" value={totalCourses} icon={<FiLayers className="w-8 h-8" />} />
            <SummaryCard title="Levels" value={totalLevels} icon={<FiLayers className="w-8 h-8" />} />
          </>
        }
        getRowId={(row) => row.id}
      />

      {showCourseModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={() => setShowCourseModal(false)} />
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4 space-y-4">
                <h2 className="text-xl font-semibold">{editingCourse ? 'Edit Course' : 'Add Course'}</h2>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Name</label>
                  <input
                    value={courseName}
                    onChange={(e) => setCourseName(e.target.value)}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  />
                </div>
                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowCourseModal(false)}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 text-sm font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={async () => {
                      try {
                        if (editingCourse) await coursesService.update(editingCourse.id, { name: courseName });
                        else await coursesService.create({ name: courseName });
                        setShowCourseModal(false);
                        await fetchAll();
                      } catch (err: any) {
                        setError(err?.response?.data?.message || 'Failed to save course');
                      }
                    }}
                    className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 text-sm font-medium"
                  >
                    Save
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {showLevelModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={() => setShowLevelModal(false)} />
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4 space-y-4">
                <h2 className="text-xl font-semibold">{editingLevel ? 'Edit Level' : 'Add Level'}</h2>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Course</label>
                  <select
                    value={levelCourseId}
                    onChange={(e) => setLevelCourseId(e.target.value)}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                    disabled={!!editingLevel}
                  >
                    {courses.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Level Name</label>
                    <input
                      value={levelName}
                      onChange={(e) => setLevelName(e.target.value)}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                      placeholder="Level 1 / Beginner"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Sort</label>
                    <input
                      type="number"
                      min={1}
                      value={levelSort}
                      onChange={(e) => setLevelSort(parseInt(e.target.value) || 1)}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                    />
                  </div>
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowLevelModal(false)}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 text-sm font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={async () => {
                      try {
                        if (editingLevel) {
                          await coursesService.updateLevel(editingLevel.id, { name: levelName, sortOrder: levelSort });
                        } else {
                          await coursesService.createLevel({ courseId: levelCourseId, name: levelName, sortOrder: levelSort });
                        }
                        setShowLevelModal(false);
                        await fetchAll();
                      } catch (err: any) {
                        setError(err?.response?.data?.message || 'Failed to save level');
                      }
                    }}
                    className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 text-sm font-medium"
                  >
                    Save
                  </button>
                </div>

                <div className="pt-4 border-t border-gray-200">
                  <h3 className="text-sm font-semibold text-gray-900 mb-2">Existing Levels</h3>
                  <div className="space-y-2">
                    {levels
                      .filter((l) => l.courseId === levelCourseId)
                      .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0))
                      .map((l) => (
                        <div key={l.id} className="flex items-center justify-between text-sm">
                          <span className="text-gray-700">
                            {l.name} <span className="text-gray-400">({l.sortOrder})</span>
                          </span>
                          <div className="flex gap-2">
                            <button
                              className="text-indigo-600 hover:text-indigo-900"
                              onClick={() => {
                                setEditingLevel(l);
                                setLevelCourseId(l.courseId);
                                setLevelName(l.name);
                                setLevelSort(l.sortOrder || 1);
                              }}
                            >
                              Edit
                            </button>
                            <button
                              className="text-red-600 hover:text-red-800"
                              onClick={async () => {
                                if (!confirm(`Delete level "${l.name}"?`)) return;
                                try {
                                  await coursesService.deleteLevel(l.id);
                                  await fetchAll();
                                } catch (err: any) {
                                  setError(err?.response?.data?.message || 'Failed to delete level');
                                }
                              }}
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      ))}
                    {levels.filter((l) => l.courseId === levelCourseId).length === 0 && (
                      <div className="text-sm text-gray-500">No levels yet.</div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


