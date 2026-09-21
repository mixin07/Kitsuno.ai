import { Route, Routes } from 'react-router-dom'
import AppLayout from './components/AppLayout.jsx'
import ProtectedRoute from './components/ProtectedRoute.jsx'
import RequireRole from './components/RequireRole.jsx'
import { ROLES } from './constants/roles.js'
import NotFoundPage from './pages/NotFoundPage.jsx'
import AdminArea from './pages/AdminArea.jsx'
import HomePage from './pages/HomePage.jsx'
import InstructorArea from './pages/InstructorArea.jsx'
import AIQuizGenerator from './pages/instructor/AIQuizGenerator.jsx'
import InstructorCourseContentPage from './pages/instructor/InstructorCourseContentPage.jsx'
import InstructorCourseFormPage from './pages/instructor/InstructorCourseFormPage.jsx'
import InstructorCoursesPage from './pages/instructor/InstructorCoursesPage.jsx'
import LoginPage from './pages/LoginPage.jsx'
import RegisterPage from './pages/RegisterPage.jsx'
import StudentLearningDashboard from './pages/student/StudentLearningDashboard.jsx'
import LessonLearningPage from './pages/student/LessonLearningPage.jsx'
import CourseDetailPage from './pages/student/CourseDetailPage.jsx'
import CourseListPage from './pages/student/CourseListPage.jsx'
import QuizPage from './pages/student/QuizPage.jsx'
import QuizResultPage from './pages/student/QuizResultPage.jsx'
import StudentAnalyticsPage from './pages/student/StudentAnalyticsPage.jsx'
import InstructorAnalyticsPage from './pages/instructor/InstructorAnalyticsPage.jsx'
import AdminAnalyticsPage from './pages/admin/AdminAnalyticsPage.jsx'
import ProfilePage from './pages/ProfilePage.jsx'

function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      <Route
        path="/courses"
        element={
          <ProtectedRoute>
            <RequireRole roles={[ROLES.STUDENT, ROLES.INSTRUCTOR, ROLES.ADMIN]}>
              <AppLayout>
                <CourseListPage />
              </AppLayout>
            </RequireRole>
          </ProtectedRoute>
        }
      />
      <Route
        path="/courses/:courseId"
        element={
          <ProtectedRoute>
            <RequireRole roles={[ROLES.STUDENT, ROLES.INSTRUCTOR, ROLES.ADMIN]}>
              <AppLayout>
                <CourseDetailPage />
              </AppLayout>
            </RequireRole>
          </ProtectedRoute>
        }
      />
      <Route
        path="/courses/:courseId/lessons/:lessonId"
        element={
          <ProtectedRoute>
            <RequireRole roles={[ROLES.STUDENT]}>
              <AppLayout>
                <LessonLearningPage />
              </AppLayout>
            </RequireRole>
          </ProtectedRoute>
        }
      />
      <Route
        path="/student/quiz/:quizId"
        element={
          <ProtectedRoute>
            <RequireRole roles={[ROLES.STUDENT]}>
              <AppLayout>
                <QuizPage />
              </AppLayout>
            </RequireRole>
          </ProtectedRoute>
        }
      />
      <Route
        path="/student/quiz/:quizId/result/:attemptId"
        element={
          <ProtectedRoute>
            <RequireRole roles={[ROLES.STUDENT]}>
              <AppLayout>
                <QuizResultPage />
              </AppLayout>
            </RequireRole>
          </ProtectedRoute>
        }
      />

      <Route
        path="/instructor/ai-quiz-generator"
        element={
          <ProtectedRoute>
            <RequireRole roles={[ROLES.INSTRUCTOR, ROLES.ADMIN]}>
              <AppLayout>
                <AIQuizGenerator />
              </AppLayout>
            </RequireRole>
          </ProtectedRoute>
        }
      />

      <Route
        path="/instructor/courses"
        element={
          <ProtectedRoute>
            <RequireRole roles={[ROLES.INSTRUCTOR, ROLES.ADMIN]}>
              <AppLayout>
                <InstructorCoursesPage />
              </AppLayout>
            </RequireRole>
          </ProtectedRoute>
        }
      />
      <Route
        path="/instructor/courses/new"
        element={
          <ProtectedRoute>
            <RequireRole roles={[ROLES.INSTRUCTOR, ROLES.ADMIN]}>
              <AppLayout>
                <InstructorCourseFormPage />
              </AppLayout>
            </RequireRole>
          </ProtectedRoute>
        }
      />
      <Route
        path="/instructor/courses/:courseId/edit"
        element={
          <ProtectedRoute>
            <RequireRole roles={[ROLES.INSTRUCTOR, ROLES.ADMIN]}>
              <AppLayout>
                <InstructorCourseFormPage />
              </AppLayout>
            </RequireRole>
          </ProtectedRoute>
        }
      />
      <Route
        path="/instructor/courses/:courseId/content"
        element={
          <ProtectedRoute>
            <RequireRole roles={[ROLES.INSTRUCTOR, ROLES.ADMIN]}>
              <AppLayout>
                <InstructorCourseContentPage />
              </AppLayout>
            </RequireRole>
          </ProtectedRoute>
        }
      />

      <Route
        path="/student"
        element={
          <ProtectedRoute>
            <RequireRole roles={[ROLES.STUDENT]}>
              <AppLayout>
                <StudentLearningDashboard />
              </AppLayout>
            </RequireRole>
          </ProtectedRoute>
        }
      />
      <Route
        path="/student/analytics"
        element={
          <ProtectedRoute>
            <RequireRole roles={[ROLES.STUDENT]}>
              <AppLayout>
                <StudentAnalyticsPage />
              </AppLayout>
            </RequireRole>
          </ProtectedRoute>
        }
      />
      <Route
        path="/instructor/analytics"
        element={
          <ProtectedRoute>
            <RequireRole roles={[ROLES.INSTRUCTOR, ROLES.ADMIN]}>
              <AppLayout>
                <InstructorAnalyticsPage />
              </AppLayout>
            </RequireRole>
          </ProtectedRoute>
        }
      />
      <Route
        path="/instructor"
        element={
          <ProtectedRoute>
            <RequireRole roles={[ROLES.INSTRUCTOR, ROLES.ADMIN]}>
              <AppLayout>
                <InstructorArea />
              </AppLayout>
            </RequireRole>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin"
        element={
          <ProtectedRoute>
            <RequireRole roles={[ROLES.ADMIN]}>
              <AppLayout>
                <AdminArea />
              </AppLayout>
            </RequireRole>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/analytics"
        element={
          <ProtectedRoute>
            <RequireRole roles={[ROLES.ADMIN]}>
              <AppLayout>
                <AdminAnalyticsPage />
              </AppLayout>
            </RequireRole>
          </ProtectedRoute>
        }
      />

      <Route
        path="/profile"
        element={
          <ProtectedRoute>
            <RequireRole roles={[ROLES.STUDENT, ROLES.INSTRUCTOR, ROLES.ADMIN]}>
              <AppLayout>
                <ProfilePage />
              </AppLayout>
            </RequireRole>
          </ProtectedRoute>
        }
      />

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  )
}

export default App