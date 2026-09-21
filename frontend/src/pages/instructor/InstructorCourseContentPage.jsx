import { useParams } from 'react-router-dom'
import CourseContentEditor from '../../components/courses/CourseContentEditor.jsx'

export default function InstructorCourseContentPage() {
  const { courseId } = useParams()

  return (
    <section>
      <CourseContentEditor courseId={courseId} />
    </section>
  )
}