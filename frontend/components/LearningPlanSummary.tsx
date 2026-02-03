import { useState } from 'react'
import type { LearningPlan, PlanCourse, CourseStatus } from '@/lib/plan'
import { updateCourseStatus } from '@/lib/api'

type Props = {
  plan: LearningPlan
  onCoursesChange?: (courses: PlanCourse[]) => void
}

const statusLabels: Record<CourseStatus, string> = {
  not_started: 'Not started',
  in_progress: 'In progress',
  completed: 'Completed',
}

const statusClasses: Record<CourseStatus, string> = {
  not_started: 'bg-gray-100 text-gray-700',
  in_progress: 'bg-yellow-100 text-yellow-800',
  completed: 'bg-green-100 text-green-800',
}

export function LearningPlanSummary({ plan, onCoursesChange }: Props) {
  const [updatingCourse, setUpdatingCourse] = useState<string | null>(null)

  const handleStatusChange = async (courseId: string, status: CourseStatus) => {
    setUpdatingCourse(courseId)
    try {
      const snapshot = updateCourseStatus(courseId, status)
      if (snapshot.plan) {
        onCoursesChange?.(snapshot.plan.courses)
      }
    } finally {
      setUpdatingCourse(null)
    }
  }

  return (
    <div className="space-y-12">
      <section className="card-modern p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-sm uppercase tracking-wide text-indigo-500 font-semibold">Learning Plan</p>
            <h2 className="text-3xl font-bold text-gray-900 mt-2">{plan.headline}</h2>
          </div>
          <div className="px-4 py-2 bg-indigo-100 text-indigo-700 rounded-full text-sm font-semibold">
            Next step: {plan.nextStep}
          </div>
        </div>
        <p className="text-gray-600 mt-4 leading-relaxed">{plan.overview}</p>
        <div className="flex flex-wrap gap-2 mt-4">
          {plan.focusSkills.map((skill) => (
            <span key={skill} className="px-3 py-1 rounded-full bg-gray-100 text-gray-700 text-sm font-medium">
              {skill}
            </span>
          ))}
        </div>
      </section>

      <section className="space-y-6">
        <h3 className="text-xl font-semibold text-gray-900">Roadmap phases</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {plan.phases.map((phase) => (
            <div key={phase.id} className="card-modern p-5 border border-indigo-100">
              <p className="text-xs uppercase tracking-wide text-indigo-500 font-semibold">{phase.duration}</p>
              <h4 className="text-xl font-bold text-gray-900 mt-2">{phase.title}</h4>
              <p className="text-gray-600 mt-3 text-sm leading-relaxed">{phase.summary}</p>
              <ul className="mt-4 space-y-2 text-sm text-gray-700">
                {phase.tasks.map((task, index) => (
                  <li key={index} className="flex gap-2">
                    <span className="mt-1 h-2 w-2 rounded-full bg-indigo-400" aria-hidden />
                    <span>{task}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-5 text-sm font-semibold text-gray-900">
                Milestone: {phase.milestone}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <h3 className="text-xl font-semibold text-gray-900">Course lineup</h3>
        <div className="space-y-3">
          {plan.courses.map((course) => (
            <div key={course.id} className="card-modern p-5 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <p className="text-sm uppercase tracking-wide text-gray-500 font-semibold">{course.provider}</p>
                <h4 className="text-lg font-bold text-gray-900">{course.title}</h4>
                <p className="text-sm text-gray-600 mt-1">{course.description}</p>
                <div className="flex flex-wrap gap-2 mt-3 text-xs text-gray-600">
                  <span>{course.duration}</span>
                  <span className="opacity-40">|</span>
                  <span>{course.level}</span>
                  {course.focus.map((tag) => (
                    <span key={tag} className="px-2 py-1 rounded-full bg-indigo-100 text-indigo-700">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
              <div className="flex items-center gap-3">
                <select
                  value={course.status}
                  onChange={(event) => handleStatusChange(course.id, event.target.value as CourseStatus)}
                  className="rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
                  disabled={updatingCourse === course.id}
                >
                  {Object.entries(statusLabels).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${statusClasses[course.status]}`}>
                  {statusLabels[course.status]}
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
