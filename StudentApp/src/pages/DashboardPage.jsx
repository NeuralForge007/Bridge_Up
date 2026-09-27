import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';

export const DashboardPage = ({ setActivePage, onOpenTimer }) => {
  const { currentUser } = useAuth();
  const { assignments, schedule, updateAssignmentStatus } = useData();

  if (!currentUser) return null;

  const pendingAssignments = assignments.filter(a => a.status === 'todo' || a.status === 'in_progress');

  const courseProgressList = [
    { course: 'CS301 Data Structures & Algorithms', code: 'CS301', percent: 92, color: 'from-blue-500 to-cyan-400' },
    { course: 'CS420 Artificial Intelligence & Neural Networks', code: 'CS420', percent: 84, color: 'from-purple-500 to-indigo-500' },
    { course: 'MATH302 Linear Algebra & Probability', code: 'MATH302', percent: 95, color: 'from-emerald-500 to-teal-400' },
    { course: 'CS450 Distributed & Cloud Systems', code: 'CS450', percent: 88, color: 'from-amber-500 to-orange-400' }
  ];

  return (
    <div className="space-y-8 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      
      {/* Welcome Hero Banner */}
      <div className="relative overflow-hidden rounded-3xl border border-blue-500/20 bg-gradient-to-r from-slate-900 via-blue-950/40 to-slate-900 p-6 sm:p-8 backdrop-blur-xl shadow-2xl">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 relative z-10">
          <div className="flex items-center gap-4">
            <img 
              src={currentUser.avatar || 'https://api.dicebear.com/7.x/avataaars/svg?seed=NextGen'} 
              alt={currentUser.name} 
              className="h-16 w-16 sm:h-20 sm:w-20 rounded-2xl border-2 border-blue-400/40 bg-slate-800 shadow-lg object-cover"
            />
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl sm:text-3xl font-black text-white">
                  Welcome back, <span className="bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">{currentUser.name}</span> 👋
                </h1>
              </div>
              <p className="text-xs sm:text-sm text-slate-300 mt-1">
                {currentUser.major || 'Computer Science'} • {currentUser.year || 'Junior (Year 3)'} | {currentUser.college_name || 'Stanford University'}
              </p>
              <div className="mt-2 flex items-center gap-2">
                <span className="inline-flex items-center gap-1 rounded-md bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-400 border border-emerald-500/20">
                  ✓ Verified Student
                </span>
                <span className="inline-flex items-center gap-1 rounded-md bg-blue-500/10 px-2 py-0.5 text-[10px] font-bold text-blue-400 border border-blue-500/20">
                  🔥 14-Day Study Streak
                </span>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <button
              onClick={() => setActivePage('mentor-finder')}
              className="rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-2.5 text-xs font-bold text-white shadow-lg shadow-blue-500/25 hover:brightness-110 transition-all flex items-center gap-2"
            >
              <span>🤖 AI Mentor Finder</span>
            </button>
            <button
              onClick={onOpenTimer}
              className="rounded-xl border border-slate-700 bg-slate-800/80 px-4 py-2.5 text-xs font-bold text-slate-200 hover:bg-slate-700 transition-all flex items-center gap-2"
            >
              <span>⏱️ Focus Timer</span>
            </button>
          </div>
        </div>
      </div>

      {/* 4 Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: GPA */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 shadow-lg">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-semibold text-slate-400">Cumulative CGPA</p>
              <p className="text-2xl font-black text-white mt-1">{currentUser.gpa || '9.20'} / 10.0</p>
            </div>
            <div className="h-10 w-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-lg text-blue-400">
              🏆
            </div>
          </div>
          <span className="mt-3 inline-block rounded bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-400 border border-emerald-500/20">
            Top 3% of Class Rank
          </span>
        </div>

        {/* Metric 2: Completed Credits */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 shadow-lg">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-semibold text-slate-400">Degree Credits</p>
              <p className="text-2xl font-black text-white mt-1">{currentUser.credits || 112} / 120</p>
            </div>
            <div className="h-10 w-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-lg text-purple-400">
              📚
            </div>
          </div>
          <span className="mt-3 inline-block rounded bg-purple-500/10 px-2 py-0.5 text-[10px] font-bold text-purple-400 border border-purple-500/20">
            93% Senior Degree Progress
          </span>
        </div>

        {/* Metric 3: Active Deadlines */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 shadow-lg">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-semibold text-slate-400">Pending Tasks</p>
              <p className="text-2xl font-black text-white mt-1">{pendingAssignments.length} Tasks</p>
            </div>
            <div className="h-10 w-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-lg text-amber-400">
              📝
            </div>
          </div>
          <span className="mt-3 inline-block rounded bg-amber-500/10 px-2 py-0.5 text-[10px] font-bold text-amber-400 border border-amber-500/20">
            2 Urgent Deadlines
          </span>
        </div>

        {/* Metric 4: Weekly Focus */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 shadow-lg">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-semibold text-slate-400">Weekly Focus Hours</p>
              <p className="text-2xl font-black text-emerald-400 mt-1">{currentUser.studyHoursWeek || '28.5'} hrs</p>
            </div>
            <div className="h-10 w-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-lg text-emerald-400">
              ⚡
            </div>
          </div>
          <span className="mt-3 inline-block rounded bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-400 border border-emerald-500/20">
            +4.2 hrs from last week
          </span>
        </div>
      </div>

      {/* Two Column Layout: Courses Progress & Urgent Radar */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Course Progress */}
        <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-6 shadow-xl">
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-base font-bold text-white">Active Course Completion</h3>
            <span className="text-xs text-slate-400">Fall Semester 2026</span>
          </div>

          <div className="space-y-4">
            {courseProgressList.map((item, idx) => (
              <div key={idx}>
                <div className="flex justify-between text-xs font-semibold text-slate-300 mb-1.5">
                  <span>{item.course}</span>
                  <span className="text-white font-bold">{item.percent}%</span>
                </div>
                <div className="h-2 rounded-full bg-slate-800 overflow-hidden">
                  <div
                    className={`h-full rounded-full bg-gradient-to-r ${item.color}`}
                    style={{ width: `${item.percent}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Upcoming Tasks & Assignments */}
        <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-6 shadow-xl">
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-base font-bold text-white">Upcoming Assignment Radar</h3>
            <button
              onClick={() => setActivePage('assignments')}
              className="text-xs text-blue-400 hover:text-blue-300 font-semibold"
            >
              Manage Tasks →
            </button>
          </div>

          <div className="space-y-3">
            {assignments.slice(0, 3).map((asg) => (
              <div
                key={asg.id}
                className="flex items-center justify-between rounded-2xl border border-slate-800 bg-slate-950/60 p-3.5"
              >
                <div>
                  <p className="text-xs font-bold text-white">{asg.title}</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    {asg.course} • Due {asg.dueDate} ({asg.dueTime})
                  </p>
                </div>

                <button
                  onClick={() => updateAssignmentStatus(asg.id, asg.status === 'submitted' ? 'todo' : 'submitted')}
                  className={`rounded-xl px-3 py-1.5 text-xs font-bold transition-all ${
                    asg.status === 'submitted'
                      ? 'bg-emerald-600/20 text-emerald-400 border border-emerald-500/30'
                      : 'bg-blue-600 text-white hover:bg-blue-500'
                  }`}
                >
                  {asg.status === 'submitted' ? '✓ Done' : 'Mark Done'}
                </button>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Class Schedule Timetable */}
      <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-6 shadow-xl overflow-x-auto">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-bold text-white">Weekly Enrolled Lecture & Lab Schedule</h3>
            <p className="text-xs text-slate-400">Classrooms and online discussion rooms</p>
          </div>
          <span className="rounded-full bg-blue-500/10 px-3 py-1 text-xs font-bold text-blue-400 border border-blue-500/20">
            📅 5 Courses Active
          </span>
        </div>

        <table className="w-full text-left text-xs text-slate-300">
          <thead className="border-b border-slate-800 text-[10px] uppercase tracking-wider text-slate-500">
            <tr>
              <th className="pb-3">Day</th>
              <th className="pb-3">Time</th>
              <th className="pb-3">Course</th>
              <th className="pb-3">Room / Hall</th>
              <th className="pb-3">Instructor</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {schedule.map((item) => (
              <tr key={item.id} className="hover:bg-slate-800/30">
                <td className="py-3 font-bold text-blue-400">{item.day}</td>
                <td className="py-3">{item.time}</td>
                <td className="py-3 font-semibold text-white">{item.course}</td>
                <td className="py-3 text-slate-400">{item.room}</td>
                <td className="py-3 text-slate-500">{item.instructor}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

    </div>
  );
};

export default DashboardPage;
